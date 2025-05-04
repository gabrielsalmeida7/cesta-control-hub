
import React from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeatmapReport from "@/components/HeatmapReport";

const Heatmap = () => {
  // Mock data
  const username = "Admin Silva";

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <Header username={username} />
      
      <main className="pt-20 pb-8 px-4 md:px-8 max-w-[1400px] mx-auto w-full flex-grow">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Mapa de Calor - Araguari-MG</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <HeatmapReport />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Heatmap;
