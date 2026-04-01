/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Satellite, Plane, Truck, Activity, Zap, Navigation, Target, 
  Mountain, Wind, Thermometer, Droplets, Eye, Shield, 
  AlertTriangle, ChevronRight, Map as MapIcon, BarChart3, Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { cn } from './lib/utils';
import { Entity, LogEntry, EnvironmentalData } from './types';

// --- Constants & Mock Data ---
const INITIAL_SHEEP_COUNT = 40;
const HAZARD_ZONE = { x: 76, y: 37, radius: 15 };

export default function App() {
  // --- State ---
  const [entities, setEntities] = useState<Entity[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [envData, setEnvData] = useState<EnvironmentalData>({
    temp: 24.2, humidity: 45, windSpeed: 12, visibility: 98
  });
  const [stressHistory, setStressHistory] = useState<{ time: string; value: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'map' | 'analytics' | 'settings'>('map');

  const mapRef = useRef<HTMLDivElement>(null);

  // --- UAV Patrol Animation ---
  const lastUavPos = useRef({ x: 50, y: 50 });
  useEffect(() => {
    let frameId: number;
    const startTime = performance.now();

    const animate = (time: number) => {
      if (!isSimulating) {
        const elapsed = (time - startTime) / 1000;
        const x = 50 + 25 * Math.sin(0.2 * elapsed + 0.5);
        const y = 50 + 15 * Math.sin(0.15 * elapsed);
        const bobX = 0.2 * Math.sin(5 * elapsed);
        const bobY = 0.2 * Math.cos(4 * elapsed);

        const dx = x - lastUavPos.current.x;
        const dy = y - lastUavPos.current.y;
        const heading = Math.atan2(dy, dx) * (180 / Math.PI) + 45; 

        lastUavPos.current = { x, y };

        setEntities(prev => prev.map(e => 
          e.id === 'uav-01' ? { ...e, x: x + bobX, y: y + bobY, heading } : e
        ));
      }
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isSimulating]);

  // --- Herd Wandering Animation ---
  useEffect(() => {
    if (isSimulating) return; // Stop wandering during predator attacks

    const wanderInterval = setInterval(() => {
      setEntities(prev => prev.map(entity => {
        if (entity.type === 'sheep' && entity.baseX && entity.baseY) {
          // Add slight random drift from their base position
          return {
            ...entity,
            x: entity.baseX + (Math.random() - 0.5) * 4,
            y: entity.baseY + (Math.random() - 0.5) * 4
          };
        }
        return entity;
      }));
    }, 3000); // Shift every 3 seconds

    return () => clearInterval(wanderInterval);
  }, [isSimulating]);

  // --- Initialization ---
  useEffect(() => {
    const initialEntities: Entity[] = [];
    
    for (let i = 0; i < INITIAL_SHEEP_COUNT; i++) {
      const baseX = 48 + (Math.random() - 0.5) * 15;
      const baseY = 52 + (Math.random() - 0.5) * 15;
      initialEntities.push({
        id: `sheep-${i}`,
        type: 'sheep',
        x: baseX,
        y: baseY,
        baseX,
        baseY,
        isLeader: i === 0,
        stressLevel: 5 + Math.random() * 10
      });
    }

    initialEntities.push({ id: 'ugv-alpha', type: 'ugv', x: 40, y: 60, status: 'PATROL', battery: 94 });
    initialEntities.push({ id: 'uav-01', type: 'uav', x: 50, y: 50, status: 'AIRBORNE', battery: 88 });

    setEntities(initialEntities);
    addLog("System initialized. Satellite uplink established.", "success");
    
    const history = Array.from({ length: 20 }, (_, i) => ({
      time: `${i}:00`, value: 10 + Math.random() * 5
    }));
    setStressHistory(history);

    const envInterval = setInterval(() => {
      setEnvData(prev => ({
        ...prev,
        temp: +(prev.temp + (Math.random() - 0.5) * 0.2).toFixed(1),
        windSpeed: +(prev.windSpeed + (Math.random() - 0.5) * 0.5).toFixed(1)
      }));
    }, 5000);

    return () => clearInterval(envInterval);
  }, []);

  // --- Helpers ---
  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      message, type
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const updateEntity = (id: string, updates: Partial<Entity>) => {
    setEntities(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  // --- Simulation Logic ---
  const runCaseStudy = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setIsManualOverride(false);
    setSelectedEntityId(null);

    addLog("CRITICAL: Commencing Automated Case Study Scenario.", "warning");
    
    // 1. Spawn Predator
    const predatorId = 'predator-01';
    const predator: Entity = { id: predatorId, type: 'predator', x: 90, y: 20, status: 'APPROACHING' };
    setEntities(prev => [...prev, predator]);
    addLog("ALERT: Thermal anomaly detected at perimeter (Sector 4).", "error");

    await sleep(1500);

    // 2. Predator moves in & Flock Scatters
    const interceptX = 65;
    const interceptY = 35;
    
    addLog("CNN Analysis: Threat confirmed. Species: Canis lupus.", "error");
    addLog("Herd stress level: CRITICAL. Initiating defensive protocols.", "warning");
    setStressHistory(prev => [...prev, { time: 'NOW', value: 75 }]);

    setEntities(prev => prev.map(e => {
      if (e.id === predatorId) return { ...e, x: interceptX, y: interceptY };
      if (e.type === 'sheep' && e.baseX && e.baseY) {
        // Scatter sheep away from the threat
        const dx = e.baseX - interceptX;
        const dy = e.baseY - interceptY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const pushStrength = 6 + (Math.random() * 4);
        return {
          ...e,
          x: e.baseX + (dx/dist) * pushStrength + (Math.random() - 0.5) * 3,
          y: e.baseY + (dy/dist) * pushStrength + (Math.random() - 0.5) * 3,
          stressLevel: 60 + Math.random() * 20
        };
      }
      return e;
    }));

    await sleep(1000);

    // 4. UGV Intercept
    addLog("UGV-Alpha: Calculating optimal intercept path avoiding Steep Ridge.", "info");
    await sleep(1000);
    updateEntity('ugv-alpha', { x: 55, y: 45, status: 'INTERCEPTING' });
    await sleep(1000);
    updateEntity('ugv-alpha', { x: 65, y: 38, status: 'ENGAGING' });
    addLog("UGV-Alpha: Deploying non-lethal acoustic deterrents.", "info");
    
    await sleep(2000);

    // 5. Predator Flees
    updateEntity(predatorId, { x: 110, y: -10, status: 'RETREATING' });
    addLog("Threat repelled. Anomaly leaving operational area.", "success");

    await sleep(1500);

    // 6. Cleanup & Herd Returns
    setEntities(prev => prev.filter(e => e.id !== predatorId).map(e => {
      if (e.type === 'sheep' && e.baseX && e.baseY) {
        // Return sheep to base area
        return { ...e, x: e.baseX, y: e.baseY, stressLevel: 10 + Math.random() * 5 };
      }
      return e;
    }));
    
    updateEntity('ugv-alpha', { x: 40, y: 60, status: 'PATROL' });
    addLog("Scenario complete. Herd secured. Resuming standard patrol.", "success");
    setIsSimulating(false);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleMapClick = (e: React.MouseEvent) => {
    if (!isManualOverride || isSimulating || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    updateEntity('ugv-alpha', { x, y });
    addLog(`Manual Waypoint: ${x.toFixed(1)}N, ${y.toFixed(1)}E`, "info");
  };

  // --- Derived Data ---
  const avgStress = useMemo(() => {
    const sheep = entities.filter(e => e.type === 'sheep');
    if (sheep.length === 0) return 0;
    return Math.round(sheep.reduce((acc, s) => acc + (s.stressLevel || 0), 0) / sheep.length);
  }, [entities]);

  const selectedEntity = useMemo(() => 
    entities.find(e => e.id === selectedEntityId), 
  [entities, selectedEntityId]);

  return (
    <div className="flex h-screen w-full bg-tech-950 text-slate-200 font-sans">
      {/* --- Sidebar --- */}
      <aside className="w-80 border-r border-tech-800 bg-tech-900 flex flex-col z-30 shadow-2xl shrink-0">
        <div className="p-6 border-b border-tech-800 flex items-center gap-3">
          <div className="bg-agri-500 p-2 rounded text-tech-950 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <Satellite className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white">ROBOÇOBAN</h1>
            <p className="text-[10px] text-agri-400 font-mono tracking-widest uppercase font-bold">Command Center Demo</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-tech-800">
          <button onClick={() => setActiveTab('map')} className={cn("flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2", activeTab === 'map' ? "text-agri-400 border-b-2 border-agri-500 bg-agri-500/5" : "text-slate-500 hover:text-slate-300")}>
            <MapIcon className="w-3 h-3" /> Map
          </button>
          <button onClick={() => setActiveTab('analytics')} className={cn("flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2", activeTab === 'analytics' ? "text-agri-400 border-b-2 border-agri-500 bg-agri-500/5" : "text-slate-500 hover:text-slate-300")}>
            <BarChart3 className="w-3 h-3" /> Analytics
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'map' ? (
            <>
              {/* System Status Section */}
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield className="w-3 h-3" /> System Health
                  </h2>
                  <div className="space-y-3">
                    {entities.filter(e => e.type === 'ugv' || e.type === 'uav').map(unit => (
                      <div key={unit.id} className="bg-tech-950/50 p-3 rounded border border-tech-800 flex items-center justify-between group hover:border-tech-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-1.5 rounded", unit.type === 'uav' ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400")}>
                            {unit.type === 'uav' ? <Plane className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-xs font-mono font-bold text-white uppercase">{unit.id}</div>
                            <div className="text-[10px] text-slate-500 font-mono">BAT: {unit.battery}%</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", unit.status === 'PATROL' || unit.status === 'AIRBORNE' ? "text-agri-400 border-agri-500/20 bg-agri-500/5" : "text-alert-500 border-alert-500/20 bg-alert-500/5 animate-pulse")}>
                            {unit.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Herd Overview */}
                <div>
                  <h2 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Herd Analytics
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-tech-950/50 p-3 rounded border border-tech-800">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Stress</div>
                      <div className={cn("text-xl font-mono font-bold", avgStress > 50 ? "text-alert-500" : avgStress > 20 ? "text-orange-400" : "text-agri-400")}>{avgStress}%</div>
                    </div>
                    <div className="bg-tech-950/50 p-3 rounded border border-tech-800">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Coverage</div>
                      <div className="text-xl font-mono font-bold text-blue-400">84%</div>
                    </div>
                  </div>
                </div>

                {/* Manual Override Toggle */}
                <div className="pt-4 border-t border-tech-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block">Manual Override</span>
                    <span className="text-[9px] text-slate-500 block">Click map to issue waypoints</span>
                  </div>
                  <button onClick={() => !isSimulating && setIsManualOverride(!isManualOverride)} className={cn("w-10 h-5 rounded-full relative transition-all duration-300 border", isManualOverride ? "bg-blue-600 border-blue-400" : "bg-tech-800 border-tech-700")}>
                    <div className={cn("w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-sm", isManualOverride ? "left-5.5" : "left-0.5")} />
                  </button>
                </div>
              </div>

              {/* Event Log */}
              <div className="flex-1 flex flex-col min-h-0 border-t border-tech-800">
                <div className="px-6 py-4 bg-tech-950/30">
                  <h2 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center justify-between">
                    Mission Log
                    <Activity className="w-3 h-3 text-agri-500 animate-pulse" />
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 font-mono text-[10px] custom-scrollbar">
                  {logs.map(log => (
                    <div key={log.id} className={cn("flex gap-2 leading-relaxed", log.type === 'error' ? "text-alert-500" : log.type === 'warning' ? "text-orange-400" : log.type === 'success' ? "text-agri-400" : "text-slate-400")}>
                      <span className="opacity-40 shrink-0">[{log.timestamp}]</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 space-y-8">
              {/* Analytics Tab Content */}
              <div>
                <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">Herd Stress (24h)</h3>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stressHistory}>
                      <defs>
                        <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke="#22c55e" fillOpacity={1} fill="url(#colorStress)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">Grazing Efficiency</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Sector A (North)', value: 92, color: 'bg-agri-500' },
                    { label: 'Sector B (East)', value: 45, color: 'bg-orange-500' },
                    { label: 'Sector C (South)', value: 78, color: 'bg-blue-500' },
                  ].map(sector => (
                    <div key={sector.label} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-400">{sector.label}</span>
                        <span className="text-white font-bold">{sector.value}%</span>
                      </div>
                      <div className="h-1 w-full bg-tech-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${sector.value}%` }} className={cn("h-full", sector.color)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-tech-950 p-4 rounded border border-tech-800">
                <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-orange-400" /> Maintenance Alerts
                </h3>
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  UAV-01 rotor inspection due in 4.2 flight hours. UGV-Alpha tread wear at 12%. No critical failures.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action */}
        <div className="p-6 border-t border-tech-800 bg-tech-950/80 backdrop-blur-md">
          <button 
            onClick={runCaseStudy}
            disabled={isSimulating}
            className={cn("w-full py-3 px-4 rounded font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border shadow-lg", isSimulating ? "bg-tech-800 text-slate-500 border-tech-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white border-blue-400 shadow-blue-500/20")}
          >
            {isSimulating ? (
              <><div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /> Scenario Running</>
            ) : (
              <><Zap className="w-3.5 h-3.5 fill-blue-200" /> Run Case Study</>
            )}
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Top Bar / HUD */}
        <header className="h-16 border-b border-tech-800 bg-tech-900/50 backdrop-blur-md flex items-center justify-between px-8 z-20 shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-tech-950 rounded border border-tech-800"><Thermometer className="w-4 h-4 text-orange-400" /></div>
              <div><div className="text-[10px] text-slate-500 font-bold uppercase">Temp</div><div className="text-xs font-mono font-bold text-white">{envData.temp}°C</div></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-tech-950 rounded border border-tech-800"><Wind className="w-4 h-4 text-blue-400" /></div>
              <div><div className="text-[10px] text-slate-500 font-bold uppercase">Wind</div><div className="text-xs font-mono font-bold text-white">{envData.windSpeed} km/h</div></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-tech-950 rounded border border-tech-800"><Droplets className="w-4 h-4 text-cyan-400" /></div>
              <div><div className="text-[10px] text-slate-500 font-bold uppercase">Humidity</div><div className="text-xs font-mono font-bold text-white">{envData.humidity}%</div></div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Location</div>
              <div className="text-xs font-mono font-bold text-agri-400">41.1029° N, 29.0259° E</div>
            </div>
            <div className="h-8 w-[1px] bg-tech-800 mx-2" />
            <button className="p-2 hover:bg-tech-800 rounded transition-colors text-slate-400"><Maximize2 className="w-4 h-4" /></button>
          </div>
        </header>

        {/* Tactical Map Area */}
        <div ref={mapRef} onClick={handleMapClick} className={cn("flex-1 relative bg-tech-950 transition-all duration-500", isManualOverride ? "cursor-crosshair" : "cursor-default")}>
          
          {/* Enhanced Topographic Wireframe Background */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.15]">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              {/* Background Grid */}
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#22c55e" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Contour Lines (Elevation simulation) */}
              {/* Hill 1 (Top Left) */}
              <path d="M 0,0 Q 200,100 300,0" fill="none" stroke="#22c55e" strokeWidth="1" />
              <path d="M 0,50 Q 250,150 400,0" fill="none" stroke="#22c55e" strokeWidth="1" />
              <path d="M 0,100 Q 300,200 500,0" fill="none" stroke="#22c55e" strokeWidth="1.5" />
              
              {/* Hill 2 (Bottom Right) */}
              <path d="M 100%,100% Q calc(100% - 200px),calc(100% - 100px) calc(100% - 300px),100%" fill="none" stroke="#22c55e" strokeWidth="1" />
              <path d="M 100%,calc(100% - 50px) Q calc(100% - 250px),calc(100% - 150px) calc(100% - 400px),100%" fill="none" stroke="#22c55e" strokeWidth="1" />
              <path d="M 100%,calc(100% - 100px) Q calc(100% - 300px),calc(100% - 200px) calc(100% - 500px),100%" fill="none" stroke="#22c55e" strokeWidth="1.5" />

              {/* Flowing Valley Lines */}
              <path d="M -100,50% Q 25%,30% 50%,50% T 110%,50%" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="8,4"/>
              <path d="M -100,calc(50% + 40px) Q 25%,calc(30% + 40px) 50%,calc(50% + 40px) T 110%,calc(50% + 40px)" fill="none" stroke="#22c55e" strokeWidth="1"/>
              <path d="M -100,calc(50% + 80px) Q 25%,calc(30% + 80px) 50%,calc(50% + 80px) T 110%,calc(50% + 80px)" fill="none" stroke="#22c55e" strokeWidth="0.5"/>
            </svg>
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <div className="w-[800px] h-[800px] border border-agri-500 rounded-full" />
            <div className="w-[600px] h-[600px] border border-agri-500 rounded-full border-dashed absolute" />
            <div className="w-[400px] h-[400px] border border-agri-500 rounded-full absolute" />
          </div>

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] radar-sweep animate-sweep" />
          </div>

          <div className="absolute inset-0 scanlines pointer-events-none opacity-30" />

          {/* Hazard Zone Visual */}
          <div className="absolute border border-orange-500/30 bg-orange-500/5 backdrop-blur-[1px] rounded-full flex items-center justify-center group" style={{ left: `${HAZARD_ZONE.x}%`, top: `${HAZARD_ZONE.y}%`, width: '18%', height: '30%', transform: 'translate(-50%, -50%) rotate(-15deg)' }}>
            <div className="flex flex-col items-center opacity-40 group-hover:opacity-100 transition-opacity">
              <Mountain className="w-6 h-6 text-orange-400 mb-1" />
              <span className="text-[8px] font-mono text-orange-400 tracking-widest uppercase text-center leading-tight">No-Go Zone<br/>Steep Ridge</span>
            </div>
          </div>

          {/* Entities Rendering */}
          <AnimatePresence>
            {entities.map(entity => (
              <motion.div
                key={entity.id} layoutId={entity.id} initial={false}
                animate={{ left: `${entity.x}%`, top: `${entity.y}%` }}
                transition={{ type: 'spring', stiffness: entity.type === 'sheep' ? 20 : 50, damping: 15 }}
                onClick={(e) => { e.stopPropagation(); setSelectedEntityId(entity.id); }}
                className={cn("absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group", selectedEntityId === entity.id && "z-30")}
              >
                {/* Entity Visuals */}
                {entity.type === 'sheep' && (
                  <div className="relative">
                    <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm transition-colors", entity.isLeader ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-agri-400")} />
                    {entity.isLeader && <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-white uppercase tracking-tighter">Leader</div>}
                  </div>
                )}

                {entity.type === 'ugv' && (
                  <div className="relative">
                    <div className="w-8 h-8 bg-emerald-500 rounded border-2 border-emerald-200 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                      <Truck className="w-4 h-4 text-tech-950" />
                    </div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-tech-900/90 border border-emerald-500/50 px-2 py-0.5 rounded text-[8px] font-mono text-emerald-400 whitespace-nowrap">{entity.id}</div>
                  </div>
                )}

                {entity.type === 'uav' && (
                  <div className="relative">
                    <motion.div animate={{ rotate: entity.heading || 45 }} className="w-7 h-7 flex items-center justify-center">
                      <Navigation className="w-6 h-6 text-blue-400 fill-blue-500/20 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                    </motion.div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-tech-900/90 border border-blue-500/50 px-2 py-0.5 rounded text-[8px] font-mono text-blue-400 whitespace-nowrap">{entity.id}</div>
                  </div>
                )}

                {entity.type === 'predator' && (
                  <div className="relative">
                    <div className="absolute inset-0 w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full pulse-alert bg-alert-500/20" />
                    <div className="w-6 h-6 bg-alert-500 rounded-full border-2 border-white flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.8)]">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-alert-900/90 border border-alert-500 px-2 py-0.5 rounded text-[8px] font-mono text-white whitespace-nowrap font-bold">ANOMALY</div>
                  </div>
                )}

                {selectedEntityId === entity.id && <div className="absolute inset-0 -m-2 border-2 border-agri-500 rounded-lg animate-pulse pointer-events-none" />}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Entity Inspector Overlay */}
          <AnimatePresence>
            {selectedEntity && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="absolute top-8 right-8 w-64 bg-tech-900/90 backdrop-blur-md border border-tech-800 rounded-lg shadow-2xl z-40 overflow-hidden"
              >
                <div className="p-4 border-b border-tech-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded", selectedEntity.type === 'sheep' ? "bg-agri-500/10 text-agri-400" : selectedEntity.type === 'uav' ? "bg-blue-500/10 text-blue-400" : selectedEntity.type === 'ugv' ? "bg-emerald-500/10 text-emerald-400" : "bg-alert-500/10 text-alert-500")}>
                      {selectedEntity.type === 'sheep' ? <Activity className="w-4 h-4" /> : selectedEntity.type === 'uav' ? <Plane className="w-4 h-4" /> : selectedEntity.type === 'ugv' ? <Truck className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                    </div>
                    <span className="text-xs font-bold font-mono text-white uppercase">{selectedEntity.id}</span>
                  </div>
                  <button onClick={() => setSelectedEntityId(null)} className="text-slate-500 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Status</div>
                      <div className="text-xs font-mono text-white">{selectedEntity.status || 'ACTIVE'}</div>
                    </div>
                    {selectedEntity.battery !== undefined && (
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Battery</div>
                        <div className="text-xs font-mono text-white">{selectedEntity.battery}%</div>
                      </div>
                    )}
                    {selectedEntity.stressLevel !== undefined && (
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Stress</div>
                        <div className={cn("text-xs font-mono font-bold", selectedEntity.stressLevel > 50 ? "text-alert-500" : "text-agri-400")}>{Math.round(selectedEntity.stressLevel)}%</div>
                      </div>
                    )}
                  </div>
                  
                  {selectedEntity.type === 'uav' && (
                    <div className="pt-4 border-t border-tech-800">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Thermal Feed</div>
                      <div className="aspect-video bg-tech-950 rounded border border-tech-800 relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center"><Eye className="w-6 h-6 text-blue-400/30" /></div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map Legend (Floating) */}
          <div className="absolute bottom-8 right-8 bg-tech-900/60 backdrop-blur-md border border-tech-800 p-4 rounded-lg z-10 pointer-events-none">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Tactical Legend</h3>
            <div className="space-y-2.5 text-[10px] font-mono">
              <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-agri-400" /> Flock Member</div>
              <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-white shadow-[0_0_5px_white]" /> Flock Leader</div>
              <div className="flex items-center gap-3"><div className="w-3 h-3 bg-emerald-500 rounded-sm" /> UGV (Ground)</div>
              <div className="flex items-center gap-3"><Navigation className="w-3 h-3 text-blue-400 rotate-45" /> UAV (Aerial)</div>
              <div className="flex items-center gap-3"><div className="w-3 h-3 bg-alert-500 rounded-full border border-white" /> Threat</div>
            </div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </div>
  );
}