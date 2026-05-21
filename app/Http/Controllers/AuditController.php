<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\AdminActionLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditController extends Controller
{
    public function index(Request $request): Response
    {
        $paginator = AdminActionLog::query()
            ->when($request->query('action'), fn ($q, $a) => $q->byAction($a))
            ->when($request->query('actorId'), fn ($q, $id) => $q->byActorId((int) $id))
            ->latest('created_at')
            ->paginate(50);

        return Inertia::render('Audit/Index', [
            'logs' => $paginator->items(),
            'pagination' => [
                'total' => $paginator->total(),
                'currentPage' => $paginator->currentPage(),
                'lastPage' => $paginator->lastPage(),
            ],
            'filters' => $request->only(['action', 'actorId']),
        ]);
    }
}
