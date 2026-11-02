import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { fmtDate, fmtNum, todayISO, uid } from '../lib/format.js'
import { t } from '../lib/i18n.js'
import Icon from '../components/Icon.jsx'
import { Button, NumberField, Section, TextField } from '../components/ui.jsx'
import { confirmSheet } from '../sheets.jsx'

const update = (fn, ...rest) => useStore.getState().update(s => { fn(s); }, ...rest)
const toast = message => useUI.getState().toast(message)

export default function Meals() {
  const navigate = useNavigate()
  const S = useStore(s => s.S)
  const meals = S.meals || []
  const [date, setDate] = useState(todayISO())
  const [name, setName] = useState('')
  const [kcal, setKcal] = useState('')
  const [prot, setProt] = useState('')

  const save = () => {
    if (!name.trim()) { toast(t('Enter a name')); return }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { toast(t('Choose a valid date')); return }
    const entry = { id: uid(), d: date, name: name.trim(), kcal: +kcal || 0, prot: +prot || 0, t: Date.now() }
    update(s => { s.meals = [...(s.meals || []), entry] })
    setName(''); setKcal(''); setProt('')
    toast(t('Saved'))
  }

  const remove = async (id) => {
    const ok = await confirmSheet(t('Delete this meal?'))
    if (!ok) return
    update(s => { s.meals = (s.meals || []).filter(m => m.id !== id) })
  }

  const byDate = {}
  for (const m of meals) { (byDate[m.d] = byDate[m.d] || []).push(m) }
  const dates = Object.keys(byDate).sort().reverse()

  return (
    <div className="page">
      <header className="page-hd">
        <button className="back" onClick={() => navigate(-1)}><Icon name="chevron-left" /></button>
        <h1>{t('Meals')}</h1>
      </header>

      <Section title={t('Add meal')}>
        <TextField label={t('Date')} value={date} onChange={setDate} type="date" />
        <TextField label={t('Name')} value={name} onChange={setName} placeholder={t('e.g. Chicken rice')} />
        <NumberField label={t('Calories')} value={kcal} onChange={setKcal} />
        <NumberField label={t('Protein (g)')} value={prot} onChange={setProt} />
        <Button onClick={save}>{t('Add')}</Button>
      </Section>

      {dates.length === 0 && <p className="empty">{t('No meals logged yet.')}</p>}

      {dates.map(d => {
        const list = byDate[d]
        const kc = list.reduce((a, b) => a + (b.kcal || 0), 0)
        const pr = list.reduce((a, b) => a + (b.prot || 0), 0)
        return (
          <Section key={d} title={fmtDate(d)}>
            {list.map(m => (
              <div key={m.id} className="row">
                <span>{m.name} — {m.kcal} kcal / {m.prot} g</span>
                <button className="del" onClick={() => remove(m.id)}><Icon name="trash" /></button>
              </div>
            ))}
            <div className="totals"><strong>{t('Total')}: {kc} kcal · {pr} g</strong></div>
          </Section>
        )
      })}
    </div>
  )
}
