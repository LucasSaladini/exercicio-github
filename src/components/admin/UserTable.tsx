"use client";

import { useEffect, useState } from "react";
import { RoleFilter, SortField, Order } from "../../../app/api/admin/users/UserFilters";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
  } from "@/components/ui/pagination"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

export type UserTableProps = {
    search: string
    role: string
    sortBy: string
    order: string
    page: number
    limit: number
    onPageChange: (page: number) => void
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

export default function UserTable({
  search,
  role,
  sortBy,
  order,
  page,
  limit,
  onPageChange,
}: UserTableProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    async function load() {
      const query = new URLSearchParams({
        search,
        role,
        sortBy,
        order,
        page: String(page),
        limit: String(limit),
      });

      const res = await fetch(`/api/admin/users?${query.toString()}`);
      const data = await res.json();

      setUsers(data.users);
      setTotal(data.total);
    }

    load();
  }, [search, role, sortBy, order, page, limit]);
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Data de Criação</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          )}

          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                    e.preventDefault()
                    if (totalPages > 1) onPageChange(totalPages - 1)
                    }}
                />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                    <PaginationLink
                    href="#"
                    isActive={page === totalPages}
                    onClick={(e) => {
                        e.preventDefault()
                        onPageChange(page)
                    }}
                    >
                    {page}
                    </PaginationLink>
                </PaginationItem>
                ))}
                {totalPages > 5 && <PaginationEllipsis />}
                <PaginationItem>
                <PaginationNext
                    href="#"
                    onClick={(e) => {
                    e.preventDefault()
                    if (totalPages < totalPages) onPageChange(totalPages + 1)
                    }}
                />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    </div>
  );
}
