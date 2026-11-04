import fs from 'fs';

// 1. Update CeoTaskCreateModal.jsx
let modal = fs.readFileSync('src/components/ceo/CeoTaskCreateModal.jsx', 'utf8');

const bannerMarker = 'marked company-wide with highest priority visibility.\n          </span>\n        </div>';
const bannerMarkerCRLF = 'marked company-wide with highest priority visibility.\r\n          </span>\r\n        </div>';

const badgeToAdd = `

        {/* Executive Assigner Visual Badge */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
              CEO
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                Assigned By (Task Issuer)
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Vikram Malhotra</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                  Chief Executive Officer
                </span>
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 font-semibold hidden sm:block">
            Autonomous Authority
          </div>
        </div>`;

if (modal.includes(bannerMarkerCRLF)) {
  modal = modal.replace(bannerMarkerCRLF, bannerMarkerCRLF + badgeToAdd.replace(/\n/g, '\r\n'));
} else if (modal.includes(bannerMarker)) {
  modal = modal.replace(bannerMarker, bannerMarker + badgeToAdd);
}

modal = modal.replace(
  /Assignee\s*<span className="text-rose-500">\*<\/span>/,
  'Assign To (Team Member / Employee) <span className="text-rose-500">*</span>'
);

modal = modal.replace(
  'Select Operational Assignee',
  'Select Team Member to Execute Directive'
);

fs.writeFileSync('src/components/ceo/CeoTaskCreateModal.jsx', modal, 'utf8');
console.log('CeoTaskCreateModal.jsx updated.');

// 2. Update CeoTaskManagement.jsx
let mgmt = fs.readFileSync('src/components/ceo/CeoTaskManagement.jsx', 'utf8');
mgmt = mgmt.replace('Assignee & Dept', 'Assigned To & Dept');
fs.writeFileSync('src/components/ceo/CeoTaskManagement.jsx', mgmt, 'utf8');
console.log('CeoTaskManagement.jsx updated.');

// 3. Update CeoFilterBar.jsx
let filter = fs.readFileSync('src/components/ceo/CeoFilterBar.jsx', 'utf8');
filter = filter.replace(
  /(\s*<label[^>]*>)\s*Assignee\s*(<\/label>)/,
  '$1Assigned To (Staff)$2'
);
fs.writeFileSync('src/components/ceo/CeoFilterBar.jsx', filter, 'utf8');
console.log('CeoFilterBar.jsx updated.');

