import {
  RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis,
  Radar, ResponsiveContainer, PolarRadiusAxis,
} from 'recharts';
import DOMAINS from '../data/domains';
import { useScores } from '../store';

export default function DomainRadarChart() {
  const { domainScores } = useScores();

  const data = DOMAINS.map(d => ({
    domain: d.name,
    score: domainScores[d.id],
    fullMark: 100,
  }));

  return (
    <div role="img" aria-label="Radar chart showing readiness scores across all domains">
      <ResponsiveContainer width="100%" height={300}>
        <RechartsRadar cx="50%" cy="50%" outerRadius="75%" data={data}>
          <defs>
            <linearGradient id="radarFillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <PolarGrid
            stroke="rgb(var(--c-border) / 0.2)"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="domain"
            tick={{
              fill: 'rgb(var(--c-muted))',
              fontSize: 11,
              fontWeight: 500,
            }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: 'rgb(var(--c-faint))', fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            name="Readiness"
            dataKey="score"
            stroke="#10b981"
            fill="url(#radarFillGrad)"
            fillOpacity={1}
            strokeWidth={2}
            dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#10b981', stroke: 'rgba(16,185,129,0.3)', strokeWidth: 4 }}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
