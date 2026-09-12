"use client";

import { useState } from "react";
import { DoctorCard } from "./doctor-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Stethoscope, Filter, Building2, UserCheck, X } from "lucide-react";
import type { Doctor } from "@/lib/contracts";

interface DoctorsViewProps {
  doctors: Doctor[];
}

export function DoctorsView({ doctors }: DoctorsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  const departments = [
    "all",
    "Heart & Vascular Pavilion",
    "Downtown Health Clinic",
    "Specialty Outpatient Wing",
    "Chest & Lung Institute",
    "Neuroscience Center",
    "Musculoskeletal Institute",
  ];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      selectedDepartment === "all" || doc.department === selectedDepartment;

    return matchesSearch && matchesDept;
  });

  const availableCount = doctors.filter((d) => d.status === "available").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-teal-200/90 bg-gradient-to-r from-teal-50/80 via-white to-teal-50/30 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100/80 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
              <Building2 className="h-3.5 w-3.5 text-teal-700" />
              <span>Hospital Physician Directory</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
              Available Doctors & Clinic Timings
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Find attending clinicians, verify consultation hours, and inspect real-time appointment availability across hospital specialties.
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-800 bg-white/90 px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 leading-none">
                {availableCount} Available Today
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">Across {departments.length - 1} departments</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by physician name, specialty, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-teal-600 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Department Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-3 border-t border-teal-100/70">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3 text-slate-400" /> Department:
          </span>
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDepartment(dept)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                selectedDepartment === dept
                  ? "bg-teal-700 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {dept === "all" ? "All Departments" : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center text-slate-500 shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mb-3">
            <Stethoscope className="h-7 w-7 text-slate-400 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No matching physicians found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            We couldn't find any doctors matching your search or filters. Try adjusting your query.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedDepartment("all");
            }}
            className="mt-4 text-xs h-8 px-3.5"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDoctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  );
}

