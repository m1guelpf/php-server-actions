<?php

use App\Actions\Actions;
use Illuminate\Support\Facades\Route;

Route::post("__action/{id}", [Actions::class, "run"]);
