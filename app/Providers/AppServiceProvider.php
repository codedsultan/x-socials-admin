<?php

declare(strict_types=1);

namespace App\Providers;

// use App\Console\Commands\ModerationScanCommand;
use App\Services\ModeratorService;
use App\Services\XSocialsApiService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Opcodes\LogViewer\Facades\LogViewer;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(XSocialsApiService::class);
        $this->app->singleton(ModeratorService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        // if ($this->app->runningInConsole()) {
        //     $this->commands([ModerationScanCommand::class]);
        // }

        if (app()->isProduction() || str_starts_with(config('app.url', ''), 'https://')) {
            URL::forceScheme('https');
        }

        Model::handleLazyLoadingViolationUsing(function ($model, $relation) {
            Log::warning("N+1 Detected: Lazy loading relation '{$relation}' on model '{$model}'.");
        });

        LogViewer::auth(function ($request) {
            // return $request->user()->hasRole('super-admin');
            return true;
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
