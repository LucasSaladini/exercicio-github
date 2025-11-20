"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

export type RoleFilter = "all" | "admin" | "attendant" | "customer";
export type SortField = "created_at" | "name" | "email" | "role";
export type Order = "asc" | "desc";

export type UserFiltersProps = {
  search: string;
  role: RoleFilter;
  sortBy: SortField;
  order: Order;
  onChange: (filters: Partial<{
    search: string;
    role: RoleFilter;
    sortBy: SortField;
    order: Order;
  }>) => void;
};

export default function UserFilters({
  search,
  onChange,
  role,
  onRole,
  sortBy,
  onSortBy,
  order,
  onOrder,
}: 
UserFiltersProps & Partial<{
  onSearch: (v: string) => void;
  onRole: (v: RoleFilter) => void;
  onSortBy: (v: SortField) => void;
  onOrder: (v: Order) => void;
}>) {
  const handleSearch = (value: string) => {
    if (typeof onChange === "function") onChange({ search: value });
    if (typeof (arguments as any).callee?.onSearch === "function") {
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center">
      <Input
        placeholder="Buscar por nome ou email..."
        value={search}
        onChange={(e) => {
          const v = (e.target as HTMLInputElement).value;
          onChange({ search: v });
        }}
        className="w-full md:w-64"
      />
      <Select
        value={role}
        onValueChange={(v) => onChange({ role: v as RoleFilter })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="attendant">Attendant</SelectItem>
          <SelectItem value="customer">Customer</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={sortBy}
        onValueChange={(v) => onChange({ sortBy: v as SortField })}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at">Data criação</SelectItem>
          <SelectItem value="name">Nome</SelectItem>
          <SelectItem value="email">Email</SelectItem>
          <SelectItem value="role">Role</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        onClick={() => onChange({ order: order === "asc" ? "desc" : "asc" })}
        className="flex items-center gap-2"
      >
        <ArrowUpDown className="w-4 h-4" />
        {order === "asc" ? "Asc" : "Desc"}
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          onChange({
            search: "",
            role: "all",
            sortBy: "created_at",
            order: "desc",
          });
        }}
      >
        Limpar
      </Button>
    </div>
  );
}
