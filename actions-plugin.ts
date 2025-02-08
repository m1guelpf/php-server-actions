import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import * as t from '@babel/types'
import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'
import _generate from '@babel/generator'
import { createFilter, FilterPattern, Plugin } from 'vite'

const traverse = _traverse.default
const generate = _generate.default

const useStatementMatcher = /^\s*use\s+.*?;/gm

const defaultOptions = {
	importModule: '@/lib/php',
	outDir: 'storage/app/actions/',
} as const

type Options = {
	outDir?: string
	exclude?: FilterPattern
	importModule?: string
}
const plugin = (config: Options = {}): Plugin => {
	const options = { ...defaultOptions, ...config }

	const filter = createFilter(/\.[jt]sx?$/, options.exclude)
	const extractedActions = new Map()

	return {
		name: 'vite-plugin-php-server-actions',

		buildStart() {
			console.log('build started')
			fs.rmSync(options.outDir, { recursive: true, force: true })
			fs.mkdirSync(options.outDir, { recursive: true })
		},

		transform(code, id) {
			if (!filter(id)) return null

			let ast
			try {
				ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] })
			} catch (err) {
				return null
			}

			let needsImportInjection = false

			traverse(ast, {
				TaggedTemplateExpression(path) {
					const { node } = path
					if (node.tag.type !== 'Identifier' || node.tag.name !== 'php') return

					needsImportInjection = true

					let phpCode = ''
					node.quasi.quasis.forEach(q => (phpCode += q.value.raw.trim()))
					const uid = crypto.createHash('md5').update(phpCode).digest('hex')
					extractedActions.set(uid, phpCode)

					path.replaceWith(t.callExpression(t.identifier('__server_action'), [t.stringLiteral(uid)]))
				},
			})

			if (needsImportInjection) {
				let importExists = false

				for (const node of ast.program.body) {
					if (node.type === 'ImportDeclaration') {
						for (const specifier of node.specifiers) {
							if (specifier.imported && specifier.imported.name === '__server_action') {
								importExists = true
								break
							}
						}
					}

					if (importExists) break
				}

				if (!importExists) {
					const importModule = options.importModule
					const importDecl = t.importDeclaration(
						[t.importSpecifier(t.identifier('__server_action'), t.identifier('__server_action'))],
						t.stringLiteral(importModule)
					)
					ast.program.body.unshift(importDecl)
				}
			}

			const output = generate(ast, {}, code)
			return { code: output.code, map: output.map }
		},

		buildEnd() {
			const outDir = options.outDir

			extractedActions.forEach((code, uid) => {
				fs.writeFileSync(path.join(outDir, `${uid}.php`), generateFile(uid, code))
			})
		},
	}
}

const generateFile = (id: string, code: string): string => {
	const useStatements = [...(code.match(useStatementMatcher) ?? [])].map(s => s.trim()).join('\n')

	return `<?php

namespace App\\Actions;

use App\\Actions\\ServerAction;
${useStatements}

class Generated${id} extends ServerAction {
    public static function getId(): string {
        return "${id}";
    }

    protected function getExtractedCode(): \\Closure {
        return ${code.replace(useStatementMatcher, '').trim()};
    }
}`
}

export default plugin
