"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeftIcon } from "@/assets/svg";
import { ChevronRight, GiftIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import PackageIcon from "@/assets/images/package.png";
import { KycCard } from "./KycCard";
import { GiftInfoCard } from "./GiftInfoCard";

// 1. Defined Interface to fix TypeScript "red dots"
interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

const calculateTimeLeft = (targetDate: string): TimeLeft => {
  const difference = +new Date(targetDate) - +new Date();
  if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  };
};

export const GiftCard = () => {
  const [activeTab, setActiveTab] = useState(1);
  const tabs = [{ id: 1, name: "gift received" }, { id: 2, name: "gift send" }];
  
  const gifts = [
    { id: "1", unlockDate: "2026-12-12T20:45:00" },
    { id: "2", unlockDate: "2026-05-10T10:00:00" }
  ];

  return (
    <div className="space-y-5">
      <div className="lg:flex gap-5 hidden">
        <StatCard amount="24" title="Gift received" bgColor="bg-[#F0FDF4]" textColor="text-[#22C55E]" />
        <StatCard amount="04" title="Gift sent" bgColor="bg-[#FEF2F2]" textColor="text-[#EF4444]" />
        <StatCard amount="07" title="Unopened Gift" bgColor="bg-[#ECEFFE]" textColor="text-[#5A42DE]" />
      </div>

      {gifts.length > 0 ? (
        <div className="p-6 bg-white w-full rounded-4xl space-y-4 shadow-sm border border-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-1.5 px-4 capitalize rounded-full transition-all duration-300 cursor-pointer text-sm font-medium ${
                    activeTab === tab.id ? "bg-[#5A42DE] text-white" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
            <Link href="#" className="flex items-center justify-center gap-1 text-[#5A42DE] text-xs font-semibold">
              See all <ChevronRight className="size-3.5" />
            </Link>
          </div>
          <div className="flex gap-5 flex-col lg:flex-row">
            {gifts.map(gift => (
              <GiftReleaseCard key={gift.id} unlockDate={gift.unlockDate} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex gap-5 flex-col lg:flex-row">
          <GiftInfoCard />
          <KycCard />
        </div>
      )}
    </div>
  );
};

const AnimatedDigit = ({ value, id }: { value: string; id: string }) => {
  return (
    <div className="h-7 w-6 bg-[#44349F] rounded overflow-hidden relative text-white text-sm leading-7 font-bold text-center">
      <div key={id} className="animate-slide-down">
        {value}
      </div>
    </div>
  );
};

const GiftReleaseCard = ({ unlockDate }: { unlockDate: string }) => {
  const [time, setTime] = useState(calculateTimeLeft(unlockDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = calculateTimeLeft(unlockDate);
      setTime(newTime);
      if (newTime.total <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [unlockDate]);

  const format = (num: number) => String(num).padStart(2, '0');

  // 2. Handling the "Just Unlocked" Edge Case
  if (time.total <= 0) {
    return (
      <div className="px-4 py-5 border border-[#F7F7FC] bg-white flex-1 rounded-xl shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-[#F7F7FC] size-11 rounded-full flex items-center justify-center">
            <Image src={PackageIcon.src} width={24} height={24} alt="Package" />
          </div>
          <p className="text-base font-medium text-[#18181B]">Gift Unlocked</p>
        </div>
        <button className="w-full py-3 bg-[#5A42DE] text-white rounded-lg font-bold hover:bg-[#4a36bc] transition-all">
          Unlock Now
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 border border-[#F7F7FC] bg-white flex-1 rounded-xl shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-[#F7F7FC] size-11 rounded-full flex items-center justify-center">
            <Image src={PackageIcon.src} width={24} height={24} alt="Package" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#18181B]">Gift Release date</p>
            <p className="text-[11px] text-[#71717A]">{new Date(unlockDate).toLocaleString()}</p>
          </div>
        </div>
        <div className="rounded-full border border-[#5A42DE] size-8 flex items-center justify-center cursor-pointer">
          <ArrowLeftIcon />
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center px-1">
        {[
          { label: 'Days', val: format(time.days) },
          { label: 'Hours', val: format(time.hours) },
          { label: 'Minutes', val: format(time.minutes) },
          { label: 'Seconds', val: format(time.seconds) }
        ].map((unit, idx) => (
          <React.Fragment key={unit.label}>
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex gap-1">
                {unit.val.split('').map((d, i) => (
                  <AnimatedDigit key={i} value={d} id={`${unit.label}-${i}-${d}`} />
                ))}
              </div>
              <p className="text-[10px] uppercase font-bold text-[#71717A] tracking-tighter">{unit.label}</p>
            </div>
            {idx < 3 && <span className="mb-5 font-bold text-[#44349F]">:</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// 3. Added proper types for StatCard to fix linting errors
interface StatProps {
  amount: string;
  title: string;
  bgColor: string;
  textColor: string;
}

export const StatCard = ({ amount, title, bgColor, textColor }: StatProps) => (
  <div className="py-7 px-4 rounded-2xl bg-white flex-1 shadow-sm border border-gray-50">
    <div className="flex justify-between items-start mb-2">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <div className={`${bgColor} size-8 rounded-xl flex items-center justify-center`}>
        <GiftIcon className={`size-4 ${textColor}`} />
      </div>
    </div>
    <p className="text-2xl font-bold text-[#18181B]">{amount}</p>
  </div>
);