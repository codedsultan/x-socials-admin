<?php

namespace App\Http\Controllers;

use App\Models\AdminActionLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditController extends Controller
{
    public function index(Request $request): Response
    {
        $query = AdminActionLog::query()
            ->when($request->query('action'), fn ($q, $a) => $q->where('action', $a))
            ->when($request->query('actorId'), fn ($q, $id) => $q->where('actor_id', $id))
            ->latest('created_at')
            ->paginate(50);

        return Inertia::render('Audit/Index', [
            'logs' => $query->items(),
            'pagination' => [
                'total' => $query->total(),
                'currentPage' => $query->currentPage(),
                'lastPage' => $query->lastPage(),
            ],
            'filters' => $request->only(['action', 'actorId']),
        ]);
    }
}
