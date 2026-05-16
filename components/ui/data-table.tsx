"use no memo"
"use client"

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"


interface DataTableProps<TData> {
  columns:       ColumnDef<TData>[]
  data:          TData[]
  onRowClick?:   (row: TData) => void
  statusFilter?: string[]
  pageSize?:     number
}

export function DataTable<TData>({
  columns,
  data,
  onRowClick,
  statusFilter = [],
  pageSize     = 8,
}: DataTableProps<TData>) {
  const [sorting, setSorting]             = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters: statusFilter.length
        ? [{ id: "status", value: statusFilter }]
        : columnFilters,
    },
    onSortingChange:       setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel:       getCoreRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize },
    },
  })

  const rows = table.getRowModel().rows

  return (
    <div className="flex flex-col gap-3">

      <div className="rounded-xl border overflow-hidden">
        <Table>

          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow
                key={hg.id}
                className="hover:bg-transparent border-b border-border/60"
              >
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="h-9 px-3 py-0">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {rows.length ? (
              rows.map((row) => {
                const rowData    = row.original as Record<string, unknown>
                const isCompleted = rowData?.status === "completed"

                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "group/row border-b border-border/40 last:border-0 transition-colors",
                      isCompleted
                        ? "opacity-55"
                        : "hover:bg-muted/40 cursor-pointer"
                    )}
                    onClick={isCompleted ? undefined : () => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-3 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  Aucun résultat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>

        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] text-muted-foreground">
            Page{" "}
            <span className="font-semibold text-foreground">
              {table.getState().pagination.pageIndex + 1}
            </span>{" "}
            sur{" "}
            <span className="font-semibold text-foreground">
              {table.getPageCount()}
            </span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}