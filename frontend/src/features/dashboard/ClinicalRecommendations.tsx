import React, { useState } from 'react'
import {
  FileText, Flame, Activity, Scale, CheckCircle2,
  AlertTriangle, Clock, ArrowRight, ShieldCheck, Dumbbell, Sparkles
} from 'lucide-react'
import { ActiveLayer } from './Dashboard3DViewer'

interface ClinicalRecommendationsProps {
  selectedHotspot: string | null
  activeLayer: ActiveLayer
  onNavigateToReports?: () => void
}

export const ClinicalRecommendations: React.FC<ClinicalRecommendationsProps> = ({
  selectedHotspot,
  activeLayer,
  onNavigateToReports
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'postural' | 'thermal' | 'nutrition'>('all')

  return (
    <div className="dash-recommendations-card">
      {/* Header */}
      <div className="dash-recomms-header">
        <div className="recomms-title-wrap">
          <div className="dash-recomm-badge">
            <Sparkles size={16} color="#00ffd5" />
            <span>PLAN CLÍNICO INTEGRADOR · RECOMENDACIONES DEL CASO</span>
          </div>
          <p className="dash-recomm-sub">
            Prescripción generada automáticamente a partir del cruce de <b>Termografía Infrarroja</b>, <b>Biomecánica 3D</b> y <b>Composición Adiposa</b>.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="recomm-category-tabs">
          <button
            className={`recomm-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Todas las Áreas (4)
          </button>
          <button
            className={`recomm-tab ${activeTab === 'postural' ? 'active' : ''}`}
            onClick={() => setActiveTab('postural')}
          >
            <Activity size={13} /> Postura & Biomecánica
          </button>
          <button
            className={`recomm-tab ${activeTab === 'thermal' ? 'active' : ''}`}
            onClick={() => setActiveTab('thermal')}
          >
            <Flame size={13} /> Descarga Térmica
          </button>
          <button
            className={`recomm-tab ${activeTab === 'nutrition' ? 'active' : ''}`}
            onClick={() => setActiveTab('nutrition')}
          >
            <Scale size={13} /> Grasa & Metabolismo
          </button>
        </div>
      </div>

      {/* Cross-Module Synthesis Bar */}
      <div className="synthesis-alert-bar">
        <div className="synth-item critical">
          <span className="synth-dot red" />
          <div>
            <b>Correlación Cervical (C3-C7):</b>
            <span>Hipertermia 37.8°C + Anteriorización 2.2 cm ➔ Sobrecarga de 4.8 kg en trapecio.</span>
          </div>
        </div>
        <div className="synth-item warning">
          <span className="synth-dot yellow" />
          <div>
            <b>Correlación Lumbopélvica:</b>
            <span>Basculación 1.8° + Apoyo 52% Izq ➔ Hipertonía en cuadrado lumbar y tensión en rodilla.</span>
          </div>
        </div>
        <div className="synth-item normal">
          <span className="synth-dot green" />
          <div>
            <b>Perfil Metabólico & Adiposo:</b>
            <span>21.8% Grasa total (14.8 kg) + Grasa visceral grado 4 ➔ Bajo riesgo cardiovascular.</span>
          </div>
        </div>
      </div>

      {/* Grid of Actionable Prescriptions */}
      <div className="recomms-cards-grid">
        {/* Card 1: Reeducación Postural (Biomecánica) */}
        {(activeTab === 'all' || activeTab === 'postural') && (
          <div className="recomm-pillar-card postural">
            <div className="pillar-header">
              <div className="pillar-icon"><Activity size={18} /></div>
              <div>
                <b>Reeducación Postural & Descompresión Cervical</b>
                <span>Objetivo: Elevar cumplimiento del 68.4% a &gt;80%</span>
              </div>
              <span className="priority-tag high">Prioridad Alta</span>
            </div>
            <ul className="pillar-list">
              <li>
                <b>Chin Tucks & Retracción Cervical:</b> 3 series de 10 reps c/u, manteniendo 5s para reducir la palanca de anteriorización de la cabeza.
              </li>
              <li>
                <b>Rebalanceo Lumbopélvico (Deadbug & Puente Glúteo):</b> Activación de glúteo medio izquierdo para corregir la basculación pélvica de 1.8°.
              </li>
              <li>
                <b>Pausa Ergonómica cada 50 minutos:</b> Descompresión de cintura escapular con apertura torácica en pared.
              </li>
            </ul>
          </div>
        )}

        {/* Card 2: Descarga Térmica & Miofascial */}
        {(activeTab === 'all' || activeTab === 'thermal') && (
          <div className="recomm-pillar-card thermal">
            <div className="pillar-header">
              <div className="pillar-icon"><Flame size={18} /></div>
              <div>
                <b>Terapia Térmica & Desactivación Miofascial</b>
                <span>Objetivo: Normalizar foco hiperdérmico de 37.8°C (ΔT &lt; 0.8°C)</span>
              </div>
              <span className="priority-tag urgent">Acción Inmediata</span>
            </div>
            <ul className="pillar-list">
              <li>
                <b>Crioterapia Localizada en Trapecios:</b> Aplicación de compresa fría por 10-12 min al final del día laboral para mitigar la hipertermia neurovascular.
              </li>
              <li>
                <b>Auto-liberación Miofascial con Pelota de Lacrosse:</b> Masaje suave en paravertebrales lumbares L4-L5 y romboides por 3 minutos por lado.
              </li>
              <li>
                <b>Baño de Contraste en Miembros Inferiores:</b> Favorecer el drenaje venoso ante la asimetría de carga del 52% en pierna izquierda.
              </li>
            </ul>
          </div>
        )}

        {/* Card 3: Composición Corporal, Grasa & Nutrición */}
        {(activeTab === 'all' || activeTab === 'nutrition') && (
          <div className="recomm-pillar-card nutrition">
            <div className="pillar-header">
              <div className="pillar-icon"><Scale size={18} /></div>
              <div>
                <b>Optimización de Composición Corporal & Tejido Graso</b>
                <span>Objetivo: Mantener grasa en 20-22% y estimular masa magra (&gt;35 kg)</span>
              </div>
              <span className="priority-tag normal">Plan Preventivo</span>
            </div>
            <ul className="pillar-list">
              <li>
                <b>Preservación de Masa Muscular Esquelética:</b> Consumo proteico diario de 1.6 g/kg (108 g/día) distribuido en 4 ingestas.
              </li>
              <li>
                <b>Control de Tejido Adiposo Subcutáneo y Visceral:</b> Mantener la ingesta calórica en gasto basal (1,640 kcal) + actividad aeróbica moderada zona 2.
              </li>
              <li>
                <b>Monitoreo de Agua Corporal (58.6% TBW):</b> Garantizar hidratación mínima de 2.2 L diarios para optimizar conductividad neuromuscular.
              </li>
            </ul>
          </div>
        )}

        {/* Card 4: Plan de Seguimiento y Reevaluación */}
        {activeTab === 'all' && (
          <div className="recomm-pillar-card tracking">
            <div className="pillar-header">
              <div className="pillar-icon"><Clock size={18} /></div>
              <div>
                <b>Cronograma de Seguimiento Clínico BODYVISION</b>
                <span>Próxima cita y reescaneo comparativo</span>
              </div>
              <span className="priority-tag follow">En 14 Días</span>
            </div>
            <ul className="pillar-list">
              <li>
                <b>Re-escaneo 3D y Termografía de Control:</b> Proyectado para el 2 de Diciembre 2026.
              </li>
              <li>
                <b>Métrica Clave de Éxito:</b> Reducción de la asimetría plantar a 50/50% y normalización térmica cervical a &lt;36.8°C.
              </li>
              <li>
                <b>Consentimiento y Registro:</b> Expediente archivado bajo Ley 29733 con firma digital autorizada.
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="recomms-bottom-bar">
        <div className="compliance-shield">
          <ShieldCheck size={16} color="#00ffd5" />
          <span>Plan validado según criterios de Biomecánica y Termografía Clínica Digital.</span>
        </div>
        {onNavigateToReports && (
          <button className="btn-export-plan" onClick={onNavigateToReports}>
            <FileText size={14} /> Exportar Plan al Expediente del Paciente
          </button>
        )}
      </div>
    </div>
  )
}
