<?php

namespace App\Actions;

use Illuminate\Container\Container;
use Illuminate\Http\Request;
use Illuminate\Routing\ResolvesRouteDependencies;
use ReflectionFunction;

abstract class ServerAction {
    use ResolvesRouteDependencies;

    public function __construct(
        protected Container $container
    ) {}

    public function run(Request $request)
    {
        $callable = $this->getExtractedCode();

        return $callable(...array_values($this->resolveMethodDependencies($request->input('args', []), new ReflectionFunction($callable))));
    }

    public static abstract function getId(): string;
    protected abstract function getExtractedCode(): \Closure;
}
