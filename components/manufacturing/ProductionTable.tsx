"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export interface ProductionItem {
  id: number;
  planOrder: number;
  modelCode: number;
  modelName: string;
  model_description: string;
  sequence: number;
  plan: number;
  production: number;
  initial_count: number;
  backflush: number;
  achieved: string; // e.g. "99.40"
}

interface Props {
  data: ProductionItem[];
  runningModel: number;
}

export default function ProductionTable({ data, runningModel }: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = data.filter(
    (i) =>
      i.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.modelCode.toString().includes(searchTerm),
  );

  const getAchievementBadge = (
    achieved: string,
    progress: number,
    plan: number,
  ) => {
    const value = parseFloat(achieved);
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    
    // Custom logic based on template colors
    const badgeStyle = value >= 100 
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : value >= 70
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";

    if (plan === 0) {
      return "";
    } else {
      return <Badge variant={variant} className={badgeStyle}>{achieved}%</Badge>;
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-gray-900 font-bold text-2xl dark:text-white">
              PRODUCTION PLAN
            </CardTitle>
          </div>

          <Input
            placeholder="Search model name or model code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
        </div>
      </CardHeader>

      <div className="p-6 pt-0">
        <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="dark:border-gray-700">
                <TableHead className="text-gray-900 dark:text-gray-100">Seq</TableHead>
                <TableHead className="text-gray-900 dark:text-gray-100">Plan Order</TableHead>
                <TableHead className="text-gray-900 dark:text-gray-100">Model Code</TableHead>
                <TableHead className="text-gray-900 dark:text-gray-100">Model Description</TableHead>
                <TableHead className="text-gray-900 dark:text-gray-100">Model Name</TableHead>
                <TableHead className="text-center text-gray-900 dark:text-gray-100">Plan</TableHead>
                <TableHead className="text-center text-gray-900 dark:text-gray-100">Initial</TableHead>
                <TableHead className="text-center text-gray-900 dark:text-gray-100">Prod</TableHead>
                <TableHead className="text-center text-gray-900 dark:text-gray-100">Backflush</TableHead>
                <TableHead className="text-center text-gray-900 dark:text-gray-100">Progress</TableHead>
                <TableHead className="text-center text-gray-900 dark:text-gray-100">Achieved (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                let progress = 0;
                if (item?.plan === 0) {
                  progress = (item?.backflush / item?.production) * 100;
                } else {
                  progress = (item.production / item.plan) * 100;
                }

                const highlight =
                  item.modelCode === +runningModel &&
                  item.production !== 0 &&
                  !(item.plan === item.production);

                return (
                  <TableRow
                    key={item.id}
                    className={`dark:border-gray-700 transition-colors duration-200
                                            ${highlight ? "bg-blue-100 dark:bg-blue-900/40 font-semibold animate-pulse" : "hover:bg-gray-50 dark:hover:bg-gray-800"}
                                        `}
                  >
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      {item.sequence}
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-white">
                      {item.planOrder}
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-white">
                      {item.modelCode}
                    </TableCell>
                    <TableCell
                      className="text-gray-900 dark:text-white max-w-xs truncate"
                      title={item.modelName}
                    >
                      {item.modelName}
                    </TableCell>
                    <TableCell
                      className="text-gray-900 dark:text-white max-w-xs truncate"
                      title={item.model_description}
                    >
                      {item.model_description}
                    </TableCell>
                    <TableCell className="text-center font-medium text-gray-900 dark:text-white">
                      {item.plan.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center font-medium text-gray-900 dark:text-white">
                      {item.initial_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center font-medium text-gray-900 dark:text-white">
                      {item.production.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center text-gray-900 dark:text-white">
                      {item.backflush.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-24">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              progress >= 100
                                ? "bg-green-600"
                                : progress >= 75
                                  ? "bg-blue-600"
                                  : progress >= 50
                                    ? "bg-yellow-600"
                                    : "bg-red-600"
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 w-12 text-right">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getAchievementBadge(item.achieved, progress, item.plan)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}
