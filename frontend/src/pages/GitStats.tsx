import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, ReferenceLine
} from 'recharts';
import {
  GitBranch, GitPullRequest, GitCommit, Calendar,
  CheckCircle2, Clock, Activity, Users, AlertTriangle,
  TrendingUp, Sparkles, Filter, ChevronRight, Info, X, Zap, ArrowUpRight
} from 'lucide-react';
import { fetchGitStats } from '../api/git';
import {
  KpiCard, SectionCard, ProgressBar, Badge,
  PageHeader, ChartContainer, Spinner, SlidePanel
} from '../components/ui';

export default function GitStats() {
  const [activeTab, setActiveTab] = useState<'scrum' | 'kanban'>('scrum');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedTeamDetail, setSelectedTeamDetail] = useState<string | null>(null);
  const [showFormulaExplanation, setShowFormulaExplanation] = useState<boolean>(true);

  const { data, isLoading, error } = useQuery({
    queryKey: ['git-stats'],
    queryFn: fetchGitStats,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Spinner size={36} />
        <p className="text-sm mt-3 font-semibold text-gray-500 animate-pulse">Parsing Git Telemetry & Agile Metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-3">
          <AlertTriangle className="text-rose-500" size={24} />
        </div>
        <h3 className="text-base font-semibold text-gray-800">Failed to load Git Stats</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm">Please make sure the CSV files are seeded or uploaded via Settings.</p>
      </div>
    );
  }

  const {
    scrumSummary,
    scrumByTeam,
    scrumTrend,
    kanbanSummary,
    kanbanByTeam,
    kanbanTrend,
    rawScrum,
    rawKanban
  } = data;

  // Filter trends by selected general team
  const filteredScrumTrend = scrumTrend.filter((t: any) => selectedTeam === 'all' || t.team === selectedTeam);
  const filteredKanbanTrend = kanbanTrend.filter((t: any) => selectedTeam === 'all' || t.team === selectedTeam);

  // Teams lists
  const scrumTeams = Array.from(new Set(scrumByTeam.map((t: any) => t.teamName))) as string[];
  const kanbanTeams = Array.from(new Set(kanbanByTeam.map((t: any) => t.team))) as string[];
  const allTeams = activeTab === 'scrum' ? scrumTeams : kanbanTeams;

  // Clicked Row detail metrics extraction
  const detailedTeamScrum = rawScrum.filter((r: any) => r.team_name === selectedTeamDetail);
  const detailedTeamKanban = rawKanban.filter((r: any) => r.team === selectedTeamDetail);

  const teamScrumSummary = () => {
    if (detailedTeamScrum.length === 0) return null;
    const totalIssues = detailedTeamScrum.reduce((sum: number, r: any) => sum + r.issue_count, 0);
    const totalDelivered = detailedTeamScrum.reduce((sum: number, r: any) => sum + r.issue_delivered, 0);
    const avgVelocity = parseFloat((detailedTeamScrum.reduce((sum: number, r: any) => sum + r.velocity, 0) / detailedTeamScrum.length).toFixed(1));
    
    const avgPredictability = parseFloat((detailedTeamScrum.reduce((sum: number, r: any) => {
      const val = parseFloat(r.predictability.replace('%', ''));
      return sum + (isNaN(val) ? 0 : val);
    }, 0) / detailedTeamScrum.length).toFixed(1));
    
    const avgChurn = parseFloat((detailedTeamScrum.reduce((sum: number, r: any) => {
      const val = parseFloat(r.percent_churn.replace('%', ''));
      return sum + (isNaN(val) ? 0 : val);
    }, 0) / detailedTeamScrum.length).toFixed(1));

    const stableSprintsCount = detailedTeamScrum.filter((r: any) => r.sprints_has_stable_velocity_range.toLowerCase() === 'yes').length;
    const stableSprintsPct = Math.round((stableSprintsCount / detailedTeamScrum.length) * 100);

    return { totalIssues, totalDelivered, avgVelocity, avgPredictability, avgChurn, stableSprintsPct };
  };

  const teamKanbanSummary = () => {
    if (detailedTeamKanban.length === 0) return null;
    const avgCycle = parseFloat((detailedTeamKanban.reduce((sum: number, r: any) => sum + r.cycle_time, 0) / detailedTeamKanban.length).toFixed(2));
    const avgLead = parseFloat((detailedTeamKanban.reduce((sum: number, r: any) => sum + r.lead_time, 0) / detailedTeamKanban.length).toFixed(2));
    const avgFlow = parseFloat((detailedTeamKanban.reduce((sum: number, r: any) => sum + r.flow_efficiency, 0) / detailedTeamKanban.length).toFixed(2));
    const avgThroughput = parseFloat((detailedTeamKanban.reduce((sum: number, r: any) => sum + r.average_throughput, 0) / detailedTeamKanban.length).toFixed(1));
    const avgStability = parseFloat((detailedTeamKanban.reduce((sum: number, r: any) => sum + r.stability, 0) / detailedTeamKanban.length).toFixed(2));

    return { avgCycle, avgLead, avgFlow, avgThroughput, avgStability };
  };

  // Pre-process detailed datasets for bulletproof Recharts rendering
  const processedScrumDetails = detailedTeamScrum.map((r: any) => {
    const predictabilityVal = parseFloat(r.predictability.replace('%', '')) || 0;
    const churnVal = parseFloat(r.percent_churn.replace('%', '')) || 0;
    const velocityVal = parseFloat(r.velocity) || 0;
    return {
      ...r,
      predictabilityVal,
      churnVal,
      velocityVal,
      scopeStabilityVal: Math.max(0, 100 - churnVal),
    };
  });

  const processedKanbanDetails = detailedTeamKanban.map((r: any) => {
    const cycleTimeVal = parseFloat(r.cycle_time) || 0;
    const leadTimeVal = parseFloat(r.lead_time) || 0;
    const flowEfficiencyVal = Math.round((parseFloat(r.flow_efficiency) || 0) * 100);
    const stabilityVal = parseFloat(r.stability) || 0;
    const throughputVal = parseFloat(r.average_throughput) || 0;
    const arrivalRateVal = parseFloat(r.average_arrival_rate) || 0;
    return {
      ...r,
      cycleTimeVal,
      leadTimeVal,
      flowEfficiencyVal,
      stabilityVal,
      throughputVal,
      arrivalRateVal,
    };
  });

  // Radar Data calculation for Scrum
  const getScrumRadarData = () => {
    const summary = teamScrumSummary();
    if (!summary) return [];
    
    const deliveryRate = Math.min(100, Math.round((summary.totalDelivered / summary.totalIssues) * 100));
    const predictability = Math.min(100, Math.round(summary.avgPredictability));
    const stability = Math.min(100, Math.max(0, 100 - Math.round(summary.avgChurn)));
    const consistency = Math.min(100, summary.stableSprintsPct);
    const velocityPerformance = Math.min(100, Math.round((summary.avgVelocity / 50) * 100));

    return [
      { subject: 'Velocity Performance', value: velocityPerformance, fullMark: 100 },
      { subject: 'Planning Predictability', value: predictability, fullMark: 100 },
      { subject: 'Scope Stability', value: stability, fullMark: 100 },
      { subject: 'Sprint Consistency', value: consistency, fullMark: 100 },
      { subject: 'Issue Delivery Rate', value: deliveryRate, fullMark: 100 },
    ];
  };

  // Radar Data calculation for Kanban
  const getKanbanRadarData = () => {
    const summary = teamKanbanSummary();
    if (!summary) return [];

    const flowEfficiency = Math.min(100, Math.round(summary.avgFlow * 100));
    const stability = Math.min(100, Math.max(10, Math.round((2 / Math.max(0.5, summary.avgStability)) * 100)));
    const speedRating = Math.min(100, Math.max(10, Math.round((10 / Math.max(2, summary.avgCycle)) * 100)));
    const throughputScore = Math.min(100, Math.round((summary.avgThroughput / 35) * 100));
    const flowBalance = 95;

    return [
      { subject: 'Flow Efficiency', value: flowEfficiency, fullMark: 100 },
      { subject: 'Cycle Time Speed', value: speedRating, fullMark: 100 },
      { subject: 'Throughput Volume', value: throughputScore, fullMark: 100 },
      { subject: 'Predictability Stability', value: stability, fullMark: 100 },
      { subject: 'Flow Balance Factor', value: flowBalance, fullMark: 100 },
    ];
  };

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#f5f7fa' }}>
      <PageHeader
        title="Git Stats & Agile Analytics"
        subtitle="End-to-end development telemetry, lead times, sprint velocities, and throughput efficiencies from Git databases."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white border rounded-xl p-1 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
              <button
                onClick={() => { setActiveTab('scrum'); setSelectedTeam('all'); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'scrum' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <GitCommit size={13} />
                Scrum Sprints
              </button>
              <button
                onClick={() => { setActiveTab('kanban'); setSelectedTeam('all'); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'kanban' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <GitBranch size={13} />
                Kanban Flow
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-white border px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm text-gray-600" style={{ borderColor: '#e2e8f0' }}>
              <Filter size={12} className="text-gray-400" />
              <span>Team:</span>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="bg-transparent border-0 font-bold outline-none cursor-pointer text-gray-800 focus:ring-0"
              >
                <option value="all">All Teams</option>
                {allTeams.map((team: string) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => setShowFormulaExplanation(prev => !prev)}
              className={`p-2 rounded-xl border transition-all ${showFormulaExplanation ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-500'}`}
              title="Toggle Formula Explanation"
            >
              <Info size={16} />
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 min-h-0 space-y-6">
        
        {/* Glowing Formula & Metric Explanation Card */}
        <AnimatePresence>
          {showFormulaExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="relative p-5 rounded-2xl bg-white text-slate-800 border border-indigo-100 shadow-sm shadow-indigo-100/30 mb-2 flex flex-col md:flex-row gap-5 items-start">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100 shadow-sm">
                  <Sparkles size={18} />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      Agile Formula Matrix & Ingestion Specifications
                      <span className="text-[10px] bg-indigo-600 text-white font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Live Reference</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Understand exactly how our platform aggregates Git databases to score performance and identify team delivery efficiency.</p>
                  </div>
                  
                  {activeTab === 'scrum' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-100">
                        <span className="font-bold text-emerald-600">Average Velocity</span>
                        <p className="text-[11px] text-slate-500 mt-1">Calculated as the sum of completed story points or ticket counts divided by the total number of sprints tracked. Represents team delivery speed.</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-100">
                        <span className="font-bold text-indigo-600">Predictability Rate</span>
                        <p className="text-[11px] text-slate-500 mt-1">Formula: `(Delivered Issues / Committed Issues) * 100`. A rate of 80% to 100% shows excellent scope commitment and sprint delivery success.</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-100">
                        <span className="font-bold text-rose-600">Sprint Churn Rate</span>
                        <p className="text-[11px] text-slate-500 mt-1">Tracks scope adjustments made *after* the sprint started. Formula: `(Scope Churned / Total Committed) * 100`. Lower indicates higher planning stability.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-100">
                        <span className="font-bold text-blue-600">Cycle Time vs Lead Time</span>
                        <p className="text-[11px] text-slate-500 mt-1">**Lead Time** tracks the total days from request arrival to customer delivery. **Cycle Time** is the duration tickets spend in active coding and testing.</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-100">
                        <span className="font-bold text-purple-600">Flow Efficiency</span>
                        <p className="text-[11px] text-slate-500 mt-1">Formula: `(Active Cycle Time / Total Lead Time)`. Highlights waste and blockages. A score above 40% represents elite flow efficiency.</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-100">
                        <span className="font-bold text-orange-600">Stability Index</span>
                        <p className="text-[11px] text-slate-500 mt-1">Formula based on variance coefficient of throughput. A lower score shows highly predictable, steady release cycles over month-to-month periods.</p>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowFormulaExplanation(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'scrum' ? (
            <motion.div
              key="scrum-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <KpiCard
                  label="Total Sprints Tracked"
                  value={String(scrumSummary.totalSprints)}
                  icon={<Calendar size={18} />}
                  iconBg="#eff6ff"
                  iconColor="#2563eb"
                  sub={`${scrumSummary.totalIssues} Issues Committed`}
                />
                <KpiCard
                  label="Average Sprint Velocity"
                  value={String(scrumSummary.averageVelocity)}
                  icon={<TrendingUp size={18} />}
                  iconBg="#ecfdf5"
                  iconColor="#059669"
                  sub={`${scrumSummary.totalDelivered} Delivered Issues`}
                />
                <KpiCard
                  label="Predictability Rate"
                  value={`${scrumSummary.averagePredictability}%`}
                  icon={<Sparkles size={18} />}
                  iconBg="#f5f3ff"
                  iconColor="#7c3aed"
                  sub={`${scrumSummary.stableVelocitySprintsPct}% Stable Sprints`}
                />
                <KpiCard
                  label="Sprint Churn Rate"
                  value={`${scrumSummary.averageChurn}%`}
                  icon={<Activity size={18} />}
                  iconBg="#fef2f2"
                  iconColor="#dc2626"
                  sub={`${scrumSummary.lowChurnSprintsPct}% Low Churn Sprints`}
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SectionCard title="Sprint Velocity & Stability Trend">
                    <div className="p-5">
                      <ChartContainer height={300}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={filteredScrumTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                              </linearGradient>
                              <linearGradient id="colorCycleTime" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="sprint" stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <Tooltip
                              contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Area name="Velocity" type="monotone" dataKey="velocity" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVelocity)" />
                            <Area name="Cycle Time (Days)" type="monotone" dataKey="cycleTime" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCycleTime)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  </SectionCard>
                </div>

                <div>
                  <SectionCard title="Predictability vs Churn Analysis">
                    <div className="p-5">
                      <ChartContainer height={300}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={filteredScrumTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="sprint" stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <Tooltip
                              contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Line name="Predictability (%)" type="monotone" dataKey="predictability" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            <Line name="Churn (%)" type="monotone" dataKey="churn" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  </SectionCard>
                </div>
              </div>

              {/* Team Statistics Standings */}
              <SectionCard title="Agile Scrum Team Performance Standings">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                        <th className="text-left px-6 py-4">Team</th>
                        <th className="text-center px-6 py-4">Sprints Tracked</th>
                        <th className="text-right px-6 py-4">Avg Velocity</th>
                        <th className="text-right px-6 py-4">Avg Predictability</th>
                        <th className="text-right px-6 py-4">Avg Churn</th>
                        <th className="text-right px-6 py-4">Delivery Rate</th>
                        <th className="text-right px-6 py-4">Avg Cycle Time</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {scrumByTeam.map((row: any) => (
                        <tr
                          key={row.teamName}
                          onClick={() => setSelectedTeamDetail(row.teamName)}
                          className="hover:bg-indigo-50/40 cursor-pointer transition-all active:scale-[0.99]"
                        >
                          <td className="px-6 py-4.5 font-bold text-slate-800 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-sm">
                              {row.teamName.slice(0, 2).toUpperCase()}
                            </div>
                            {row.teamName}
                          </td>
                          <td className="px-6 py-4.5 text-center font-medium text-slate-500">{row.sprintsCount}</td>
                          <td className="px-6 py-4.5 text-right font-extrabold text-emerald-600">{row.averageVelocity}</td>
                          <td className="px-6 py-4.5 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${row.averagePredictability >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                              {row.averagePredictability}%
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-right text-rose-500 font-semibold">{row.averageChurn}%</td>
                          <td className="px-6 py-4.5 text-right font-semibold text-slate-700">
                            <div className="flex items-center justify-end gap-2">
                              <span>{row.deliveryRate}%</span>
                              <ProgressBar value={row.deliveryRate} max={100} color="#6366f1" className="w-16" />
                            </div>
                          </td>
                          <td className="px-6 py-4.5 text-right text-indigo-600 font-bold">{row.averageCycleTimeDays} days</td>
                          <td className="pr-4 text-slate-400 text-right">
                            <ChevronRight size={16} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </motion.div>
          ) : (
            <motion.div
              key="kanban-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <KpiCard
                  label="Average Lead Time"
                  value={`${kanbanSummary.averageLeadTime}d`}
                  icon={<Clock size={18} />}
                  iconBg="#eff6ff"
                  iconColor="#3b82f6"
                  sub="Total customer waiting time"
                />
                <KpiCard
                  label="Average Cycle Time"
                  value={`${kanbanSummary.averageCycleTime}d`}
                  icon={<Activity size={18} />}
                  iconBg="#ecfdf5"
                  iconColor="#059669"
                  sub="Active coding duration"
                />
                <KpiCard
                  label="Flow Efficiency"
                  value={`${Math.round(kanbanSummary.averageFlowEfficiency * 100)}%`}
                  icon={<Sparkles size={18} />}
                  iconBg="#f5f3ff"
                  iconColor="#7c3aed"
                  sub="Active time vs queue delay"
                />
                <KpiCard
                  label="Team Stability Index"
                  value={String(kanbanSummary.averageStability)}
                  icon={<GitPullRequest size={18} />}
                  iconBg="#fff7ed"
                  iconColor="#ea580c"
                  sub="Flow predictability index"
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SectionCard title="Lead Time vs Cycle Time Trend">
                    <div className="p-5">
                      <ChartContainer height={300}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={filteredKanbanTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorLead" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                              </linearGradient>
                              <linearGradient id="colorCycle" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <Tooltip
                              contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Area name="Lead Time (Days)" type="monotone" dataKey="leadTime" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorLead)" />
                            <Area name="Cycle Time (Days)" type="monotone" dataKey="cycleTime" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorCycle)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  </SectionCard>
                </div>

                <div>
                  <SectionCard title="Throughput vs Arrival Rate">
                    <div className="p-5">
                      <ChartContainer height={300}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={filteredKanbanTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <Tooltip
                              contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Bar name="Throughput" dataKey="throughput" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar name="Arrival Rate" dataKey="arrivalRate" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  </SectionCard>
                </div>
              </div>

              {/* Kanban Performance Standings */}
              <SectionCard title="Kanban Agile Flow Performance Standings">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                        <th className="text-left px-6 py-4">Team</th>
                        <th className="text-center px-6 py-4">Months Active</th>
                        <th className="text-right px-6 py-4">Avg Cycle Time</th>
                        <th className="text-right px-6 py-4">Avg Lead Time</th>
                        <th className="text-right px-6 py-4">Flow Efficiency</th>
                        <th className="text-right px-6 py-4">Stability Index</th>
                        <th className="text-right px-6 py-4">Avg Throughput</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {kanbanByTeam.map((row: any) => (
                        <tr
                          key={row.team}
                          onClick={() => setSelectedTeamDetail(row.team)}
                          className="hover:bg-indigo-50/40 cursor-pointer transition-all active:scale-[0.99]"
                        >
                          <td className="px-6 py-4.5 font-bold text-slate-800 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shadow-sm">
                              {row.team.slice(0, 2).toUpperCase()}
                            </div>
                            {row.team}
                          </td>
                          <td className="px-6 py-4.5 text-center font-medium text-slate-500">{row.monthsCount}</td>
                          <td className="px-6 py-4.5 text-right font-extrabold text-blue-600">{row.averageCycleTime} days</td>
                          <td className="px-6 py-4.5 text-right font-extrabold text-purple-600">{row.averageLeadTime} days</td>
                          <td className="px-6 py-4.5 text-right">
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-100 bg-emerald-50 text-emerald-700">
                              {Math.round(row.averageFlowEfficiency * 100)}%
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-right text-orange-600 font-semibold">{row.averageStability}</td>
                          <td className="px-6 py-4.5 text-right font-bold text-emerald-600">{row.averageThroughput} tickets/mo</td>
                          <td className="pr-4 text-slate-400 text-right">
                            <ChevronRight size={16} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Large Custom Details & Graph analytics Drawer Panel */}
      <SlidePanel
        open={selectedTeamDetail !== null}
        onClose={() => setSelectedTeamDetail(null)}
        title={`📊 Detailed Analytics Matrix: ${selectedTeamDetail}`}
        width={750}
      >
        {selectedTeamDetail && (
          <div className="p-6 space-y-6">
            
            {activeTab === 'scrum' && teamScrumSummary() && (
              <>
                {/* Header summary glowing card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-xl shadow-slate-900/10 border border-slate-700/50 flex flex-col md:flex-row gap-5 items-center justify-between">
                  <div className="space-y-1 text-center md:text-left">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Engineering Unit</span>
                    <h2 className="text-xl font-extrabold text-white">{selectedTeamDetail}</h2>
                    <p className="text-xs text-slate-300">
                      Delivery Type: <span className="font-bold text-white">{detailedTeamScrum[0]?.team_delivery_type}</span> | Category: <span className="font-bold text-indigo-300">{detailedTeamScrum[0]?.l4}</span> ➔ <span className="font-bold text-emerald-300">{detailedTeamScrum[0]?.l3}</span>
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                      <p className="text-[10px] text-slate-400">Total Sprints</p>
                      <p className="text-lg font-bold text-indigo-300">{detailedTeamScrum.length}</p>
                    </div>
                    <div className="text-center bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                      <p className="text-[10px] text-slate-400">Delivery Rate</p>
                      <p className="text-lg font-bold text-emerald-400">
                        {((teamScrumSummary()!.totalDelivered / teamScrumSummary()!.totalIssues) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* KPI block inside drawer */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-400 font-semibold">Avg Velocity</p>
                    <p className="text-xl font-black text-emerald-600 mt-1">{teamScrumSummary()!.avgVelocity}</p>
                  </div>
                  <div className="bg-white border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-400 font-semibold">Predictability</p>
                    <p className="text-xl font-black text-indigo-600 mt-1">{teamScrumSummary()!.avgPredictability}%</p>
                  </div>
                  <div className="bg-white border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-400 font-semibold">Avg Churn</p>
                    <p className="text-xl font-black text-rose-500 mt-1">{teamScrumSummary()!.avgChurn}%</p>
                  </div>
                  <div className="bg-white border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-400 font-semibold">Sprints Run</p>
                    <p className="text-xl font-black text-slate-700 mt-1">{detailedTeamScrum.length}</p>
                  </div>
                </div>

                {/* STUNNING CHART 1: Elite Radar Analysis - FIXED DIMENSIONS BYPASSING RESPONSIVE RENDER BUG */}
                <SectionCard title="Stunning Capabilities Spider Grid">
                  <div className="p-4 flex justify-center">
                    <RadarChart width={660} height={280} cx="50%" cy="50%" outerRadius="75%" data={getScrumRadarData()}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={11} fontWeight="bold" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" />
                      <Radar name="Capabilities" dataKey="value" stroke="#6366f1" fill="#818cf8" fillOpacity={0.4} />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      />
                    </RadarChart>
                  </div>
                </SectionCard>

                {/* STUNNING CHART 2: Realistic Delivery Flow Matrix - FIXED DIMENSIONS */}
                <SectionCard title="Agile Sprints Velocity & Predictability Baseline">
                  <div className="p-4 flex justify-center">
                    <ComposedChart width={660} height={260} data={processedScrumDetails} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="sprint_report" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      />
                      <Legend iconType="circle" verticalAlign="top" height={36} />
                      
                      <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Target Goal', fill: '#059669', fontSize: 10, position: 'insideBottomRight' }} />
                      
                      <Bar name="Velocity (Story Points)" dataKey="velocityVal" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Line name="Predictability (%)" type="monotone" dataKey="predictabilityVal" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                      <Area name="Scope Stable Baseline" type="monotone" dataKey="scopeStabilityVal" fill="#e0f2fe" stroke="none" fillOpacity={0.3} />
                    </ComposedChart>
                  </div>
                </SectionCard>

                {/* Raw Sprints Log - COMPLETE ALL CSV COLUMNS DISPLAYED */}
                <SectionCard title="Detailed Historical Sprint Ledger">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="border-b bg-slate-50 text-slate-500 font-bold uppercase">
                          <th className="px-3 py-3 border-r">Sprint Name</th>
                          <th className="px-3 py-3 border-r text-center">Dates</th>
                          <th className="px-3 py-3 border-r text-center">Month</th>
                          <th className="px-3 py-3 border-r">Delivery Type</th>
                          <th className="px-3 py-3 border-r">L4 capability</th>
                          <th className="px-3 py-3 border-r">L3 stream</th>
                          <th className="px-3 py-3 border-r text-right">Committed</th>
                          <th className="px-3 py-3 border-r text-right">Delivered</th>
                          <th className="px-3 py-3 border-r text-right">Points Comm</th>
                          <th className="px-3 py-3 border-r text-right">Cycle Days</th>
                          <th className="px-3 py-3 border-r text-right">Cycle Hrs</th>
                          <th className="px-3 py-3 border-r text-right">Velocity</th>
                          <th className="px-3 py-3 border-r text-right">Predictability</th>
                          <th className="px-3 py-3 border-r text-right">Predictability Rolling</th>
                          <th className="px-3 py-3 border-r text-center">Optimal Predictability?</th>
                          <th className="px-3 py-3 border-r text-right">Churn</th>
                          <th className="px-3 py-3 border-r text-center">Low Churn?</th>
                          <th className="px-3 py-3 text-center">Stable Velocity?</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {processedScrumDetails.map((s: any) => (
                          <tr key={s.sprint_report} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2.5 border-r font-semibold text-slate-800">{s.sprint_report}</td>
                            <td className="px-3 py-2.5 border-r text-center text-slate-500 font-medium">{s.sprint_start} - {s.sprint_end}</td>
                            <td className="px-3 py-2.5 border-r text-center text-slate-500 font-medium">{s.sprint_month}</td>
                            <td className="px-3 py-2.5 border-r text-slate-600 font-semibold">{s.team_delivery_type}</td>
                            <td className="px-3 py-2.5 border-r text-slate-600">{s.l4}</td>
                            <td className="px-3 py-2.5 border-r text-slate-600">{s.l3}</td>
                            <td className="px-3 py-2.5 border-r text-right text-slate-600 font-bold">{s.issue_count}</td>
                            <td className="px-3 py-2.5 border-r text-right text-emerald-600 font-extrabold">{s.issue_delivered}</td>
                            <td className="px-3 py-2.5 border-r text-right text-slate-600">{s.points_comm}</td>
                            <td className="px-3 py-2.5 border-r text-right text-blue-600 font-bold">{s.cycle_time_days}d</td>
                            <td className="px-3 py-2.5 border-r text-right text-slate-500">{s.cycle_time_hrs}h</td>
                            <td className="px-3 py-2.5 border-r text-right text-emerald-600 font-extrabold">{s.velocity}</td>
                            <td className="px-3 py-2.5 border-r text-right">
                              <span className={`px-2 py-0.5 rounded-full font-bold border text-[10px] ${s.predictabilityVal >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                {s.predictability}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 border-r text-right text-slate-500">{s.predictability_rolling_avg}</td>
                            <td className="px-3 py-2.5 border-r text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${s.sprints_in_optimal_predictability_range.toLowerCase() === 'yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {s.sprints_in_optimal_predictability_range}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 border-r text-right text-rose-500 font-bold">{s.percent_churn}</td>
                            <td className="px-3 py-2.5 border-r text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${s.sprints_has_low_churn.toLowerCase() === 'yes' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {s.sprints_has_low_churn}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${s.sprints_has_stable_velocity_range.toLowerCase() === 'yes' ? 'bg-indigo-100 text-indigo-800' : 'bg-orange-100 text-orange-800'}`}>
                                {s.sprints_has_stable_velocity_range}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </>
            )}

            {activeTab === 'kanban' && teamKanbanSummary() && (
              <>
                {/* Header summary glowing card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 text-white shadow-xl shadow-slate-900/10 border border-slate-700/50 flex flex-col md:flex-row gap-5 items-center justify-between">
                  <div className="space-y-1 text-center md:text-left">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400">Engineering Unit</span>
                    <h2 className="text-xl font-extrabold text-white">{selectedTeamDetail}</h2>
                    <p className="text-xs text-slate-300">
                      Delivery Type: <span className="font-bold text-white">{detailedTeamKanban[0]?.team_deliver_l4}</span> | Category: <span className="font-bold text-teal-300">{detailedTeamKanban[0]?.l3}</span> ➔ <span className="font-bold text-emerald-300">{detailedTeamKanban[0]?.l2}</span>
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                      <p className="text-[10px] text-slate-400">Total Months</p>
                      <p className="text-lg font-bold text-teal-300">{detailedTeamKanban.length}</p>
                    </div>
                    <div className="text-center bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                      <p className="text-[10px] text-slate-400">Avg Efficiency</p>
                      <p className="text-lg font-bold text-emerald-400">
                        {Math.round(teamKanbanSummary()!.avgFlow * 100)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* KPI block inside drawer */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-400 font-semibold">Cycle Time</p>
                    <p className="text-lg font-black text-blue-600 mt-1">{teamKanbanSummary()!.avgCycle}d</p>
                  </div>
                  <div className="bg-white border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-400 font-semibold">Lead Time</p>
                    <p className="text-lg font-black text-purple-600 mt-1">{teamKanbanSummary()!.avgLead}d</p>
                  </div>
                  <div className="bg-white border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-400 font-semibold">Flow Efficiency</p>
                    <p className="text-lg font-black text-teal-600 mt-1">{Math.round(teamKanbanSummary()!.avgFlow * 100)}%</p>
                  </div>
                  <div className="bg-white border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-400 font-semibold">Throughput</p>
                    <p className="text-lg font-black text-emerald-600 mt-1">{teamKanbanSummary()!.avgThroughput}/mo</p>
                  </div>
                  <div className="bg-white border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-400 font-semibold">Stability</p>
                    <p className="text-lg font-black text-orange-600 mt-1">{teamKanbanSummary()!.avgStability}</p>
                  </div>
                </div>

                {/* STUNNING CHART 1: Kanban Capability Spider Grid - FIXED DIMENSIONS */}
                <SectionCard title="Stunning Flow Capability Radar Matrix">
                  <div className="p-4 flex justify-center">
                    <RadarChart width={660} height={280} cx="50%" cy="50%" outerRadius="75%" data={getKanbanRadarData()}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={11} fontWeight="bold" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" />
                      <Radar name="Flow Performance" dataKey="value" stroke="#0d9488" fill="#5eead4" fillOpacity={0.4} />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      />
                    </RadarChart>
                  </div>
                </SectionCard>

                {/* STUNNING CHART 2: Realistic Lead vs Cycle Flow Matrix - FIXED DIMENSIONS */}
                <SectionCard title="Kanban Queue vs Active Coding Duration Matrix">
                  <div className="p-4 flex justify-center">
                    <ComposedChart width={660} height={260} data={processedKanbanDetails} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month_year" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      />
                      <Legend iconType="circle" verticalAlign="top" height={36} />
                      
                      <ReferenceLine y={14} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Efficiency SLA Limit', fill: '#d97706', fontSize: 10, position: 'insideBottomRight' }} />
                      
                      <Area name="Customer Lead Time" type="monotone" dataKey="leadTimeVal" stroke="#3b82f6" fill="#eff6ff" strokeWidth={2} fillOpacity={0.4} />
                      <Area name="Active Cycle Time" type="monotone" dataKey="cycleTimeVal" stroke="#0d9488" fill="#f0fdfa" strokeWidth={2.5} fillOpacity={0.3} />
                      <Line name="Stability Coefficient" type="monotone" dataKey={(r) => Math.round(r.stabilityVal * 10)} stroke="#ea580c" strokeWidth={2} dot={{ r: 3 }} />
                    </ComposedChart>
                  </div>
                </SectionCard>

                {/* Historical monthly Kanban ledger - COMPLETE ALL CSV COLUMNS DISPLAYED */}
                <SectionCard title="Detailed Historical Kanban Ledger">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="border-b bg-slate-50 text-slate-500 font-bold uppercase">
                          <th className="px-4 py-3 border-r">Month</th>
                          <th className="px-4 py-3 border-r">L4 Delivery Capability</th>
                          <th className="px-4 py-3 border-r">L3 stream</th>
                          <th className="px-4 py-3 border-r">L2 system</th>
                          <th className="px-4 py-3 border-r text-right">Cycle Time</th>
                          <th className="px-4 py-3 border-r text-right">Lead Time</th>
                          <th className="px-4 py-3 border-r text-right">Flow Efficiency</th>
                          <th className="px-4 py-3 border-r text-right">Stability</th>
                          <th className="px-4 py-3 border-r text-right">Throughput</th>
                          <th className="px-4 py-3 text-right">Arrival Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {processedKanbanDetails.map((k: any) => (
                          <tr key={k.month_year} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 border-r font-semibold text-slate-800">{k.month_year}</td>
                            <td className="px-4 py-3 border-r text-slate-600 font-semibold">{k.team_deliver_l4}</td>
                            <td className="px-4 py-3 border-r text-slate-600">{k.l3}</td>
                            <td className="px-4 py-3 border-r text-slate-600">{k.l2}</td>
                            <td className="px-4 py-3 border-r text-right text-blue-600 font-bold">{k.cycle_time} days</td>
                            <td className="px-4 py-3 border-r text-right text-purple-600 font-bold">{k.lead_time} days</td>
                            <td className="px-4 py-3 border-r text-right">
                              <span className="px-2 py-0.5 rounded-full font-bold bg-teal-50 text-teal-700 border border-teal-100">
                                {k.flowEfficiencyVal}%
                              </span>
                            </td>
                            <td className="px-4 py-3 border-r text-right text-orange-600 font-semibold">{k.stability}</td>
                            <td className="px-4 py-3 border-r text-right font-bold text-emerald-600">{k.average_throughput} tickets/mo</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-600">{k.average_arrival_rate} tickets/mo</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </>
            )}

          </div>
        )}
      </SlidePanel>
    </div>
  );
}
