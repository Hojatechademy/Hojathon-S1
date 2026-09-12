"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Calendar, CheckCircle2, UserCheck, Stethoscope, Sparkles } from "lucide-react";
import type { Doctor } from "@/lib/contracts";
import { useState } from "react";

interface DoctorCardProps {
  doctor: Doctor;
  onSelectSlot?: (doctor: Doctor, slot: string) => void;
}

export function DoctorCard({ doctor, onSelectSlot }: DoctorCardProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const getStatusBadge = (status: Doctor["status"]) => {
    switch (status) {
      case "available":
        return (
          <Badge variant="success" className="gap-1 bg-emerald-50 text-emerald-800 border-emerald-200">
            <UserCheck className="h-3 w-3 text-emerald-600" />
            <span>Available</span>
          </Badge>
        );
      case "in_consultation":
        return (
          <Badge variant="warning" className="gap-1 bg-amber-50 text-amber-800 border-amber-200">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>In Clinic</span>
          </Badge>
        );
      case "off_duty":
      default:
        return (
          <Badge variant="secondary" className="gap-1 text-slate-500 bg-slate-100">
            <span>Off Duty</span>
          </Badge>
        );
    }
  };

  const handleSlotClick = (slot: string) => {
    setSelectedSlot(slot);
    setBookingConfirmed(false);
  };

  const handleConfirmBooking = () => {
    if (selectedSlot) {
      setBookingConfirmed(true);
      if (onSelectSlot) {
        onSelectSlot(doctor, selectedSlot);
      }
    }
  };

  return (
    <Card className="flex flex-col justify-between border-slate-200/90 shadow-xs transition-all hover:border-teal-300 hover:shadow-card-hover bg-white rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-slate-50/70 to-white pb-4 pt-5 px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-800 to-teal-600 font-bold text-white shadow-xs text-sm">
              {doctor.avatarInitials}
              {doctor.status === "available" && (
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
              )}
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 leading-tight">
                {doctor.name}
              </CardTitle>
              <div className="flex items-center gap-1.5 text-xs text-teal-700 font-medium mt-0.5">
                <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
                <span>{doctor.specialty}</span>
              </div>
            </div>
          </div>
          {getStatusBadge(doctor.status)}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">
              <strong className="text-slate-800">{doctor.department}</strong> — {doctor.location}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span>
              Hours: <strong className="text-slate-800">{doctor.timing}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span>
              Days: <span className="font-semibold text-slate-700">{doctor.availableDays.join(", ")}</span>
            </span>
          </div>
        </div>

        {/* Appointment Slot Pills */}
        <div className="pt-3 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-teal-600" /> Available Consultation Slots:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {doctor.availableSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => handleSlotClick(slot)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  selectedSlot === slot
                    ? "bg-teal-700 text-white shadow-xs"
                    : "bg-teal-50/70 text-teal-800 border border-teal-200/80 hover:bg-teal-100/80"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Slot Confirmation Card */}
        {selectedSlot && (
          <div className="mt-2 rounded-xl bg-teal-50/80 p-3 border border-teal-200 text-xs transition-all">
            {bookingConfirmed ? (
              <div className="flex items-center gap-2 text-teal-900 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="text-[11px]">
                  Slot {selectedSlot} reserved with {doctor.name}. Ask your Follow-up Assistant to finalize this booking.
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span className="text-teal-950 font-medium text-xs">
                  Selected: <strong>{selectedSlot}</strong>
                </span>
                <Button
                  size="sm"
                  onClick={handleConfirmBooking}
                  className="h-7 px-3 text-xs bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                >
                  Select Slot
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

