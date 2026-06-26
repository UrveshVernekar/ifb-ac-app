"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Hospital } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface OptionItem {
  value: string;
  label: string;
}

interface DropdownData {
  ohccatlist: OptionItem[];
  userlist: OptionItem[];
  departlist: OptionItem[];
  ohcaseslist: OptionItem[];
  ohcinjurylist: OptionItem[];
  risklist: OptionItem[];
}

export default function OhcFormPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Time calculations
  const [cDate, setCDate] = useState("");
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmpm] = useState("AM");

  // Form Fields
  const [octype, setOctype] = useState("");
  const [ecode, setEcode] = useState("");
  const [age, setAge] = useState("");
  const [exper, setExper] = useState("");
  const [ename, setEname] = useState("");
  const [gender, setGender] = useState("");
  const [comp, setComp] = useState("");
  const [dtype, setDtype] = useState("");
  const [attended, setAttended] = useState("");
  const [superv, setSuperv] = useState("");
  const [slevel, setSlevel] = useState("");
  const [cases, setCases] = useState("");
  const [injury, setInjury] = useState("");
  const [fag, setFag] = useState("");

  const [optionList, setOptionList] = useState<DropdownData>({
    ohccatlist: [],
    userlist: [],
    departlist: [],
    ohcaseslist: [],
    ohcinjurylist: [],
    risklist: [],
  });

  const API_HOST_3003 = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

  const fetchDropdownData = useCallback(async () => {
    setOptionsLoading(true);
    const currentYear = new Date().getFullYear();
    const url = `${API_HOST_3003}/safety/ohc/year=${currentYear}&ptype=AC&rtype=FY&sdate=sdate&edate=edate`;

    try {
      const res = await axios.get(url);
      if (res.data) {
        const deduplicate = (arr: OptionItem[]) => {
          if (!arr) return [];
          const seen = new Set<string>();
          return arr.filter((item) => {
            if (!item || item.value === undefined || item.value === null) return false;
            const val = String(item.value).trim();
            if (seen.has(val)) {
              return false;
            }
            seen.add(val);
            return true;
          });
        };

        setOptionList({
          ohccatlist: deduplicate(res.data.ohccatlist),
          userlist: deduplicate(res.data.userlist),
          departlist: deduplicate(res.data.departlist),
          ohcaseslist: deduplicate(res.data.ohcaseslist),
          ohcinjurylist: deduplicate(res.data.ohcinjurylist),
          risklist: deduplicate(res.data.risklist),
        });
      }
    } catch (err) {
      console.error("Error loading OHC form dropdown lists:", err);
      toast.error("Failed to load OHC options");
    } finally {
      setOptionsLoading(false);
    }
  }, [API_HOST_3003]);

  useEffect(() => {
    setMounted(true);
    // Initialize date and time
    const now = new Date();
    setCDate(now.toISOString().split("T")[0]);
    let h12 = now.getHours() % 12;
    if (h12 === 0) h12 = 12;
    setHour(h12.toString());
    setMinute(now.getMinutes().toString().padStart(2, "0"));
    setAmpm(now.getHours() >= 12 ? "PM" : "AM");
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchDropdownData();
    }
  }, [mounted, fetchDropdownData]);

  // Autofill name when ecode changes
  useEffect(() => {
    if (ecode) {
      const matched = optionList.userlist.find((u) => u.value === ecode);
      if (matched) {
        setEname(matched.label.toUpperCase());
      }
    } else {
      setEname("");
    }
  }, [ecode, optionList.userlist]);

  const isFormValid = () => {
    return (
      cDate &&
      hour &&
      minute &&
      ampm &&
      octype &&
      ecode &&
      age &&
      exper &&
      ename.trim() &&
      gender &&
      comp.trim() &&
      dtype &&
      attended.trim() &&
      superv &&
      slevel &&
      cases &&
      injury &&
      fag.trim()
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.error("Please fill all required fields");
      return;
    }

    const cTime = `${cDate} ${hour}:${minute} ${ampm}`;

    // Helper functions
    const isCreated = (options: OptionItem[], val: string) => !options.some((opt) => opt.value === val);
    const getSelectedOption = (options: OptionItem[], value: string) => {
      return options.find((opt) => opt.value === value) || { value, label: value };
    };
    const adjustValueForEmail = (val: string) => {
      if (!val) return val;
      return val.includes("-") ? val : `${val}-`;
    };

    // User options mapped
    const employeeOptions = optionList.userlist;
    const supervisorOptions = optionList.userlist;
    const departmentOptions = optionList.departlist;
    const casesOptions = optionList.ohcaseslist;
    const injuryOptions = optionList.ohcinjurylist;

    const sform = {
      cDate,
      cTime,
      octype,
      ecode: (() => {
        if (!ecode) return [];
        const sel = getSelectedOption(employeeOptions, ecode);
        if (isCreated(employeeOptions, ecode)) {
          return [{ value: "100001", label: ecode }];
        }
        return [sel];
      })(),
      ename,
      age: parseInt(age),
      exper: parseFloat(exper),
      gender,
      comp,
      dtype: dtype ? [getSelectedOption(departmentOptions, dtype)] : [],
      attended,
      superv: (() => {
        if (!superv) return [];
        const sel = getSelectedOption(supervisorOptions, superv);
        if (isCreated(supervisorOptions, superv)) {
          return [{ value: "000000-", label: superv }];
        }
        const adjustedVal = adjustValueForEmail(superv);
        return [{ ...sel, value: adjustedVal }];
      })(),
      fag,
      slevel,
      cases: cases ? [getSelectedOption(casesOptions, cases)] : [],
      injury: injury ? [getSelectedOption(injuryOptions, injury)] : [],
    };

    setLoading(true);
    try {
      await axios.post(`${API_HOST_3003}/safety/ohc/ohcformdata`, {
        formdata: JSON.stringify(sform),
        ptype: JSON.stringify("AC"),
      });
      toast.success("Patient registered and logged successfully!");
      router.push("/safety/ohc-list");
    } catch (err) {
      console.error("OHC form submission error:", err);
      toast.error("Failed to submit OHC patient registration");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Link href="/safety">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
            <Hospital className="w-6 h-6 text-teal-600" />
            Occupational Health Center (OHC)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log patient visits, first aid treatments, and medical cases.
          </p>
        </div>
      </div>

      <Card className="border-border/60 shadow-md">
        <CardHeader className="bg-gradient-to-r from-teal-500/10 to-transparent border-b border-border/40 pb-4">
          <CardTitle className="text-sm font-bold tracking-wide text-foreground uppercase">
            Patient Entry Form
          </CardTitle>
          <CardDescription className="text-xs">
            Complete the fields below to register patient visits. Highlighted (*) fields are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="cDate" className="text-xs font-semibold">Select Date *</Label>
                <Input
                  id="cDate"
                  type="date"
                  value={cDate}
                  onChange={(e) => setCDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Select Time *</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                    className="h-9 text-xs w-16 text-center"
                    placeholder="HH"
                    required
                  />
                  <span className="self-center font-bold text-muted-foreground">:</span>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                    className="h-9 text-xs w-16 text-center"
                    placeholder="MM"
                    required
                  />
                  <select
                    value={ampm}
                    onChange={(e) => setAmpm(e.target.value)}
                    className="flex h-9 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus:outline-none"
                    required
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {/* Observation Type */}
              <div className="space-y-2">
                <Label htmlFor="octype" className="text-xs font-semibold">Observation Type *</Label>
                <select
                  id="octype"
                  value={octype}
                  onChange={(e) => setOctype(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1"
                  required
                >
                  <option value="">Select Type</option>
                  {optionList.ohccatlist.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee Code */}
              <div className="space-y-2">
                <Label htmlFor="ecode" className="text-xs font-semibold">Employee Code *</Label>
                <select
                  id="ecode"
                  value={ecode}
                  onChange={(e) => setEcode(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none"
                  required
                >
                  <option value="">Select Employee</option>
                  {optionList.userlist.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.value} - {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient Name */}
              <div className="space-y-2">
                <Label htmlFor="ename" className="text-xs font-semibold">Patient Name *</Label>
                <Input
                  id="ename"
                  value={ename}
                  onChange={(e) => setEname(e.target.value.toUpperCase())}
                  placeholder="Patient Name"
                  className="h-9 text-xs uppercase"
                  required
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold block mb-1">Gender *</Label>
                <div className="flex gap-4 pt-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Male"
                      checked={gender === "Male"}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-3.5 h-3.5"
                      required
                    />
                    Male
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Female"
                      checked={gender === "Female"}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-3.5 h-3.5"
                      required
                    />
                    Female
                  </label>
                </div>
              </div>

              {/* Age */}
              <div className="space-y-2">
                <Label htmlFor="age" className="text-xs font-semibold">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <Label htmlFor="exper" className="text-xs font-semibold">Experience (Years) *</Label>
                <Input
                  id="exper"
                  type="number"
                  min="0"
                  step="0.5"
                  value={exper}
                  onChange={(e) => setExper(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="dtype" className="text-xs font-semibold">Department *</Label>
                <select
                  id="dtype"
                  value={dtype}
                  onChange={(e) => setDtype(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none"
                  required
                >
                  <option value="">Select Department</option>
                  {optionList.departlist.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Attended By */}
              <div className="space-y-2">
                <Label htmlFor="attended" className="text-xs font-semibold">Attended By *</Label>
                <Input
                  id="attended"
                  value={attended}
                  onChange={(e) => setAttended(e.target.value)}
                  placeholder="Doctor / Nurse name"
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* Supervisor */}
              <div className="space-y-2">
                <Label htmlFor="superv" className="text-xs font-semibold">Supervisor *</Label>
                <select
                  id="superv"
                  value={superv}
                  onChange={(e) => setSuperv(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none"
                  required
                >
                  <option value="">Select Supervisor</option>
                  {optionList.userlist.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity Level */}
              <div className="space-y-2">
                <Label htmlFor="slevel" className="text-xs font-semibold">Severity Level *</Label>
                <select
                  id="slevel"
                  value={slevel}
                  onChange={(e) => setSlevel(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none"
                  required
                >
                  <option value="">Select Severity</option>
                  {optionList.risklist.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cases */}
              <div className="space-y-2">
                <Label htmlFor="cases" className="text-xs font-semibold">Cases Classification *</Label>
                <select
                  id="cases"
                  value={cases}
                  onChange={(e) => setCases(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none"
                  required
                >
                  <option value="">Select Case Type</option>
                  {optionList.ohcaseslist.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Injury */}
              <div className="space-y-2">
                <Label htmlFor="injury" className="text-xs font-semibold">Injury Classification *</Label>
                <select
                  id="injury"
                  value={injury}
                  onChange={(e) => setInjury(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none"
                  required
                >
                  <option value="">Select Injury Type</option>
                  {optionList.ohcinjurylist.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Complaints */}
            <div className="space-y-2">
              <Label htmlFor="comp" className="text-xs font-semibold">Patient Complaints *</Label>
              <Textarea
                id="comp"
                value={comp}
                onChange={(e) => setComp(e.target.value)}
                placeholder="List patient symptoms and complaints..."
                className="min-h-[80px] text-xs"
                required
              />
            </div>

            {/* First Aid Given */}
            <div className="space-y-2">
              <Label htmlFor="fag" className="text-xs font-semibold">First Aid / Treatment Given *</Label>
              <Textarea
                id="fag"
                value={fag}
                onChange={(e) => setFag(e.target.value)}
                placeholder="Log medication, treatment, dressing or first aid administered..."
                className="min-h-[80px] text-xs"
                required
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
              <Link href="/safety">
                <Button type="button" variant="outline" size="sm" className="h-9 text-xs">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading || optionsLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 min-w-[120px] shadow-md gap-2"
              >
                {loading ? (
                  "Submitting..."
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Registration
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
