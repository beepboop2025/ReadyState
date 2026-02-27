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
    <ResponsiveContainer width="100%" height={300}>
      <RechartsRadar cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid stroke="rgba(100,116,139,0.2)" />
        <PolarAngleAxis
          dataKey="domain"
          tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fill: '#475569', fontSize: 10 }}
          axisLine={false}
        />
        <Radar
          name="Readiness"
          dataKey="score"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.15}
          strokeWidth={2}
          dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  );
}
