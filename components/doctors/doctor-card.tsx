"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Calendar, CheckCircle2, UserCheck, Stethoscope, Sparkles, Loader2 } from "lucide-react";
import type { Doctor } from "@/lib/contracts";
import { useState, useTransition } from "react";
import { bookDoctorAppointment } from "@/app/doctors/actions";

interface DoctorCardProps {
  doctor: Doctor;
  onSelectSlot?: (doctor: Doctor, slot: string) => void;
}

export function DoctorCard({ doctor, onSelectSlot }: DoctorCardProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const getStatusBadge = (status: Doctor["status"]) => {
    switch (status) {
      case "available":
        return (
          <Badge variant="success" className="gap-1 bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            <UserCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>Available</span>
          </Badge>
        );
      case "in_consultation":
        return (
          <Badge variant="warning" className="gap-1 bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
            <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span>In Clinic</span>
          </Badge>
        );
      case "off_duty":
      default:
        return (
          <Badge variant="secondary" className="gap-1 text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
            <span>Off Duty</span>
          </Badge>
        );
    }
  };

  const handleSlotClick = (slot: string) => {
    setSelectedSlot(slot);
    setBookingConfirmed(false);
    setBookingMessage(null);
  };

  const handleConfirmBooking = () => {
    if (!selectedSlot) return;

    startTransition(async () => {
      const res = await bookDoctorAppointment({
        doctorName: doctor.name,
        department: doctor.department,
        location: doctor.location,
        slot: selectedSlot,
      });

      if (res.error) {
        setBookingMessage(`Booking failed: ${res.error}`);
        return;
      }

      setBookingConfirmed(true);
      setBookingMessage(`Confirmed appointment with ${doctor.name} for ${selectedSlot}. Added to your follow-up dashboard!`);
      if (onSelectSlot) {
        onSelectSlot(doctor, selectedSlot);
      }
    });
  };

  return (
    <Card className="flex flex-col justify-between border-slate-200/90 shadow-2xs hover:shadow-card-hover hover:border-teal-300 transition-all rounded-2xl overflow-hidden bg-white dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-700">
      <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-800 to-teal-600 font-bold text-white shadow-xs text-sm">
              {doctor.avatarInitials}
              {doctor.status === "available" && (
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
              )}
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 leading-tight dark:text-white">
                {doctor.name}
              </CardTitle>
              <div className="flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-400 font-medium mt-0.5">
                <Stethoscope className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>{doctor.specialty}</span>
              </div>
            </div>
          </div>
          {getStatusBadge(doctor.status)}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">
              <strong className="text-slate-800 dark:text-slate-200">{doctor.department}</strong> — {doctor.location}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span>
              Hours: <strong className="text-slate-800 dark:text-slate-200">{doctor.timing}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span>
              Days: <span className="font-semibold text-slate-700 dark:text-slate-300">{doctor.availableDays.join(", ")}</span>
            </span>
          </div>
        </div>

        {/* Appointment Slot Pills */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-teal-600 dark:text-teal-400" /> Available Consultation Slots:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {doctor.availableSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => handleSlotClick(slot)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  selectedSlot === slot
                    ? "bg-teal-700 text-white shadow-xs dark:bg-teal-600"
                    : "bg-teal-50/70 text-teal-800 border border-teal-200/80 hover:bg-teal-100/80 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800/80 dark:hover:bg-teal-900/60"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Slot Confirmation Card */}
        {selectedSlot && (
          <div className="mt-2 rounded-xl bg-teal-50/80 p-3 border border-teal-200 text-xs transition-all dark:bg-teal-950/40 dark:border-teal-800/80">
            {bookingConfirmed ? (
              <div className="flex items-start gap-2 text-teal-900 dark:text-teal-200 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  {bookingMessage || `Slot ${selectedSlot} confirmed with ${doctor.name}. Saved to your Supabase schedule!`}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span className="text-teal-950 dark:text-teal-300 font-medium text-xs">
                  Selected: <strong>{selectedSlot}</strong>
                </span>
                <Button
                  size="sm"
                  onClick={handleConfirmBooking}
                  disabled={isPending}
                  className="h-7 px-3 text-xs bg-teal-700 hover:bg-teal-800 text-white font-semibold gap-1 dark:bg-teal-600 dark:hover:bg-teal-700"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Booking...</span>
                    </>
                  ) : (
                    <span>Confirm Booking</span>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


