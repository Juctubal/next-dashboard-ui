"use client";

import React, { useState } from "react";
import DerbyRecommendations from "@/components/recommendations/DerbyRecommendations";
import BreedingRecommendations from "@/components/recommendations/BreedingRecommendations";
import SparringRecommendations from "@/components/recommendations/SparringRecommendations";
import ConditioningRecommendations from "@/components/recommendations/ConditioningRecommendations";

export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState("derby");

  const tabs = [
    { id: "derby", label: "Derby Selection", icon: "🏆" },
    { id: "breeding", label: "Breeding Pairs", icon: "🥚" },
    { id: "sparring", label: "Sparring Matches", icon: "⚔️" },
    { id: "conditioning", label: "Conditioning Programs", icon: "💪" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Intelligent Recommendations
            </h1>
            <p className="mt-2 text-gray-600">
              AI-powered recommendations using Bayesian analysis and Elo ratings
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                    ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <span className="text-xl">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "derby" && <DerbyRecommendations />}
        {activeTab === "breeding" && <BreedingRecommendations />}
        {activeTab === "sparring" && <SparringRecommendations />}
        {activeTab === "conditioning" && <ConditioningRecommendations />}
      </div>

      {/* Analytics Summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-4">System Intelligence</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-blue-100 text-sm">Bayesian Learning</p>
              <p className="text-2xl font-bold">Continuous</p>
              <p className="text-sm mt-1 text-blue-100">
                System improves with every match result
              </p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Elo Accuracy</p>
              <p className="text-2xl font-bold">±32 points</p>
              <p className="text-sm mt-1 text-blue-100">
                Dynamic rating adjustments per match
              </p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Prediction Confidence</p>
              <p className="text-2xl font-bold">Growing</p>
              <p className="text-sm mt-1 text-blue-100">
                More data increases prediction accuracy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
