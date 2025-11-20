"use client";

import { useSearchParams, useRouter } from "next/navigation";
import UserFilters from "../../api/admin/users/UserFilters";
import UserTable from "@/components/admin/UserTable";

type RoleFilter = "all" | "admin" | "attendant" | "customer";
type SortField = "name" | "email" | "role" | "created_at";
type Order = "asc" | "desc";

export default function UsersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const parseRole = (value: string | null): RoleFilter => {
    const allowed: RoleFilter[] = ["all", "admin", "attendant", "customer"];
    return allowed.includes(value as RoleFilter)
      ? (value as RoleFilter)
      : "all";
  };

  const parseSortBy = (value: string | null): SortField => {
    const allowed: SortField[] = ["name", "email", "role", "created_at"];
    return allowed.includes(value as SortField)
      ? (value as SortField)
      : "created_at";
  };

  const parseOrder = (value: string | null): Order => {
    const allowed: Order[] = ["asc", "desc"];
    return allowed.includes(value as Order)
      ? (value as Order)
      : "asc";
  };

  const filters = {
    search: searchParams.get("search") ?? "",
    role: parseRole(searchParams.get("role")),
    sortBy: parseSortBy(searchParams.get("sortBy")),
    order: parseOrder(searchParams.get("order")),
    page: Number(searchParams.get("page") ?? 1),
    limit: Number(searchParams.get("limit") ?? 10),
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Gerenciamento de Usuários</h1>
      <UserFilters
        search={filters.search}
        role={filters.role}
        sortBy={filters.sortBy}
        order={filters.order}
        onChange={updateFilters}
      />
      <UserTable
        search={filters.search}
        role={filters.role}
        sortBy={filters.sortBy}
        order={filters.order}
        page={filters.page}
        limit={filters.limit}
        onPageChange={(newPage) => updateFilters({ page: newPage })}
      />
    </div>
  );
}
