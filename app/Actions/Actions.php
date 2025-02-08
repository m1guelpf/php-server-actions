<?php

namespace App\Actions;

use Illuminate\Http\Request;
use ReflectionClass;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Symfony\Component\Finder\Finder;
use Symfony\Component\Finder\SplFileInfo;

class Actions {
    /** @var array<string, ServerAction> */
    protected $actions = [];

    public function __construct()
    {
        $this->load([storage_path('app/actions')]);
    }

    public function run(string $id, Request $request)
    {
        if (!isset($this->actions[$id])) {
            abort(404);
        }

        return $this->actions[$id]->run($request);
    }

    protected function load($paths)
    {
        $paths = collect(Arr::wrap($paths))->unique()->filter(fn ($path) => is_dir($path));
        if ($paths->isEmpty()) return;

        $namespace = app()->getNamespace();

        foreach (Finder::create()->in($paths->toArray())->files() as $file) {
            require_once $file;
            $action = $this->actionClassFromFile($file, $namespace);

            if (is_subclass_of($action, ServerAction::class) && !(new ReflectionClass($action))->isAbstract()) {
                $instance = app($action);

                $this->actions[$instance->getId()] = $instance;
            }
        }
    }

    protected function actionClassFromFile(SplFileInfo $file, string $namespace): string
    {
        return $namespace."Actions\\Generated".str_replace(
            ['/', '.php'],
            ['\\', ''],
            Str::after($file->getRealPath(), realpath(storage_path('app/actions')).DIRECTORY_SEPARATOR)
        );
    }
}
