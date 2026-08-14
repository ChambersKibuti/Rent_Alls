import React from "react";
import PageLayout from "@/components/PageLayout";

export default function Terms() {
  return (
    <PageLayout>
      <div className="pt-28 pb-32 max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-black text-zinc-900 mb-8">Terms of Service</h1>
        <div className="prose prose-invert prose-sm max-w-none text-zinc-600 space-y-4">
          <p>By using RentAlls you agree to these terms. Please read them carefully before renting any equipment.</p>
          <h2 className="text-zinc-900 font-bold text-lg">Rental Agreement</h2>
          <p>All rentals are subject to availability and equipment condition. You are responsible for the safe use and timely return of rented assets. Damage beyond normal wear is the renter's responsibility.</p>
          <h2 className="text-zinc-900 font-bold text-lg">Payments</h2>
          <p>All payments are processed at the time of booking. Accepted methods include card, mobile money, USSD, and bank transfer. Deposits are refundable upon satisfactory return of equipment.</p>
          <h2 className="text-zinc-900 font-bold text-lg">Concerns & Disputes</h2>
          <p>Use the Raise Concern feature in your profile for any issues. We aim to resolve all concerns within 48 hours. You may also reach us via WhatsApp or phone.</p>
        </div>
      </div>
    </PageLayout>
  );
}