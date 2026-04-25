"use client";

const JOB_FUNCTIONS = [
  { label:'💻 Tech & IT',    q:'Informatique' },
  { label:'📊 Finance',       q:'Finance'      },
  { label:'📣 Marketing',     q:'Marketing'    },
  { label:'🤝 Commercial',    q:'Commercial'   },
  { label:'⚙️ Ingénierie',   q:'Ingénierie'   },
  { label:'🏥 Santé',         q:'Santé'        },
  { label:'👥 RH',            q:'RH'           },
  { label:'🎓 Stage / PFE',   q:'Stage'        },
];

export default function JobFunctionFilters() {
  return (
    <div style={{ background:'white', borderBottom:'1.5px solid #ede9fe', padding:'16px 24px', overflowX:'auto' }}>
      <div style={{ maxWidth:1060, margin:'0 auto', display:'flex', gap:8, alignItems:'center', flexWrap:'nowrap' }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#9ca3af', whiteSpace:'nowrap', marginRight:4 }}>Parcourir :</span>
        {JOB_FUNCTIONS.map(fn => (
          <a key={fn.q} href={`/?q=${encodeURIComponent(fn.q)}`}
            style={{ display:'inline-flex', alignItems:'center', padding:'7px 14px', borderRadius:100, border:'1.5px solid #ede9fe', background:'white', fontSize:12, fontWeight:600, color:'#374151', whiteSpace:'nowrap', textDecoration:'none', transition:'all .18s' }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor='#7c3aed'; el.style.color='#7c3aed'; el.style.background='#f5f3ff'; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor='#ede9fe'; el.style.color='#374151'; el.style.background='white'; }}>
            {fn.label}
          </a>
        ))}
        <a href="/?q=Télétravail" style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:100, border:'1.5px solid #f0fdf4', background:'#f0fdf4', fontSize:12, fontWeight:700, color:'#065f46', whiteSpace:'nowrap', textDecoration:'none' }}>
          🏠 Télétravail
        </a>
      </div>
    </div>
  );
}
