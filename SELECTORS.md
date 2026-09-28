# Zendesk DOM Recon Evidence Ledger

This ledger contains only sanitized structural observations from the authenticated
English Zendesk Agent Workspace session prepared for Phase 1. It intentionally
omits tenant hostnames, view identifiers, ticket identifiers, subjects, people,
organizations, account identifiers, and raw DOM captures. Conclusions are limited
to the current shell observed on 2026-09-03; the account-plan label was not shared.

The three live scenarios are named only by their structural purpose:

- `priority-present-grouped-long`: Priority present, one group row, long/scrollable.
- `priority-present-ungrouped`: Priority present, no group row, long/scrollable.
- `priority-absent`: Priority absent, no group row, long/scrollable.

## Ledger Entry: tracer-english-path

- id: `tracer-english-path`
- question: Can one complete synthetic entry traverse the evidence gate without asserting a live Zendesk fact?
- scope: `English path`
- status: `verified`
- probe: `document.querySelector('[data-synthetic="ticket-list"]') !== null`
- evidence: Sanitized synthetic contract markup contains the expected test-only ticket-list marker.
- interpretation: The repository validator can enforce the D-13 field contract entirely offline; this says nothing about the live Zendesk DOM.
- fallback: Block the repository gate and collect a complete sanitized entry before accepting evidence.
- scenario: `synthetic-contract`

## Ledger Entry: shell-metadata

- id: `shell-metadata`
- question: What capture date, current Agent Workspace shell, account plan, and non-identifying page metadata bound each observation?
- scope: `English path`
- status: `verified`
- probe: `({ captureDate: new Date().toISOString().slice(0, 10), filterPath: /^\/agent\/filters\/[^/]+$/.test(location.pathname), topFrame: window === window.top, htmlLang: document.documentElement.lang || null })`
- evidence: On 2026-09-03 all three scenarios were open in the current Agent Workspace, returned `filterPath: true`, `topFrame: true`, and `htmlLang: "en"`. The account-plan label was unknown/not shared.
- interpretation: These findings are bounded to the observed English current shell and do not establish behavior for another plan, shell, or locale.
- fallback: Re-run this matrix for any materially different shell, plan, or locale before relying on these selectors.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`, `priority-absent`

## Ledger Entry: top-document-reachability

- id: `top-document-reachability`
- question: Is a selected ticket row reachable from the expected top document, and is its owner document hosted in a frame?
- scope: `English path`
- status: `verified`
- probe: `({ consoleIsTopFrame: window === window.top, selectedNodeOwnerIsConsoleDocument: row.ownerDocument === document, reachableFromConsoleDocument: document.contains(row), ownerFrameTag: row.ownerDocument.defaultView?.frameElement?.tagName ?? null })`
- evidence: Each scenario returned `consoleIsTopFrame: true`, `selectedNodeOwnerIsConsoleDocument: true`, `reachableFromConsoleDocument: true`, and `ownerFrameTag: null` for a ticket row selected from its ticket table.
- interpretation: The observed ticket tables are directly reachable in the top document and are not hosted in a child frame.
- fallback: If any future shell returns a frame or owner-document mismatch, resolve and document that frame boundary before querying or styling rows.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`, `priority-absent`

## Ledger Entry: root-chain

- root-terminus: `Document`
- shadow-root-proof: `root-chain-plus-top-document-reachability`

- id: `root-chain`
- question: What is the complete root and host chain from a selected ticket row to its owner document, including every ShadowRoot mode?
- scope: `English path`
- status: `verified`
- probe: `(() => { const roots=[]; let node=row; while(node){ const root=node.getRootNode(); if(root===node.ownerDocument){ roots.push({type:'Document'}); break; } roots.push({type:'ShadowRoot', mode:root.mode ?? null, hostTag:root.host?.tagName ?? null}); node=root.host; } return roots; })()`
- evidence: All three selected rows returned the complete root chain `[{ type: "Document" }]`; `row.ownerDocument === document` and `document.contains(row) === true` were also true in every scenario.
- interpretation: No open or closed ShadowRoot lies between the observed ticket row and its owner document. This conclusion uses the selected node's root chain and reachability, not `host.shadowRoot === null`.
- fallback: Any future `ShadowRoot` entry must record its mode and host; a closed root blocks the Phase 2 design.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`, `priority-absent`

## Ledger Entry: stable-identifiers

- id: `stable-identifiers`
- question: Which `data-garden-id` and `data-test-id` values identify the ticket table, header, ticket rows, group rows, and cells?
- scope: `English path`
- status: `verified`
- probe: `([...boundary.querySelectorAll('[data-garden-id], [data-test-id]')].reduce((out, element) => { for (const name of ['data-garden-id','data-test-id']) { const value=element.getAttribute(name); if(value) out[name][value]=(out[name][value]||0)+1; } return out; }, {'data-garden-id':{},'data-test-id':{}}))`
- evidence: No ancestor exposed a dedicated stable table-container test identifier. The nearest complete stable boundary was therefore the table itself: `table[data-garden-id="tables.table"][data-test-id="generic-table"]`; its ancestor chain later exposed `data-garden-id="pane.content"`, `data-garden-id="pane"`, and `data-test-id="views_views-pane-div"`. The table's own header was `[data-garden-id="tables.head"][data-test-id="generic-table-head"]`; the body was `[data-garden-id="tables.body"][data-test-id="generic-table-body"]`; ticket rows were `[data-garden-id="tables.row"][data-test-id="generic-table-row"]`; group rows were `[data-garden-id="tables.group_row"][data-test-id="generic-table-rows-group-by"]`; direct cells used `data-garden-id="tables.cell"`; and header cells used `data-garden-id="tables.header_cell"`. Counts were: grouped-long `table 1 / head 1 / body 1 / header_cell 15 / row 30 / group_row 1 / cell 451`; ungrouped `1 / 1 / 1 / 16 / 30 / 0 / 480`; Priority-absent `1 / 1 / 1 / 6 / 30 / 0 / 180`.
- interpretation: Rank Garden identifiers first, pair them with the matching test identifiers second, and use element-agnostic structural relationships only as a final fallback. A broad `tbody > tr` selector is unsafe because it includes group rows.
- fallback: If Garden identifiers disappear, require the paired test identifiers across all three fixtures; if both disappear, block until a structural discriminator is proven across the matrix.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`, `priority-absent`

## Ledger Entry: header-topology

- id: `header-topology`
- question: Does the body table contain its own header, or must headers be resolved from a sibling sticky or duplicate header table?
- scope: `English path`
- status: `disproved`
- probe: `(() => { const table=row.closest('table'); return { ownHead:Boolean(table.tHead), headerCount:table.querySelectorAll(':scope > thead [data-garden-id="tables.header_cell"]').length, siblingHeaderTables:[...table.parentElement.children].filter(element=>element!==table && element.matches?.('table')).length }; })()`
- evidence: Each ticket table had its own `THEAD`; header counts were 15, 16, and 6 respectively, and no sibling header table was present at the observed table boundary.
- interpretation: The proposed sibling/duplicate-header topology is disproved for these scenarios. Header resolution must stay inside the same `generic-table` as the ticket rows.
- fallback: If a later layout exposes a sibling table, bind it through the nearest shared table container and re-verify column alignment before reading Priority.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`, `priority-absent`

## Ledger Entry: priority-representation

- id: `priority-representation`
- question: How is Priority represented in its header and cells, and is any locale-independent machine-readable signal present?
- scope: `English path`
- status: `verified`
- probe: `(() => { const headers=[...table.querySelectorAll('[data-garden-id="tables.header_cell"]')]; const index=headers.findIndex(cell=>cell.textContent.trim()==='Priority'); const cells=[...table.querySelectorAll('[data-garden-id="tables.row"]')].map(row=>row.children[index]); return { index, headerText:headers[index]?.textContent.trim() ?? null, cells:cells.map(cell=>({ allowedText:['Urgent','High','Normal','Low'].includes(cell?.textContent.trim()) ? cell.textContent.trim() : '<empty-or-unreadable>', ariaLabel:cell?.getAttribute('aria-label') ?? null, attributeNames:cell?.getAttributeNames() ?? [], datasetKeys:Object.keys(cell?.dataset ?? {}) })) }; })()`
- evidence: Priority was the zero-based header index 6 in both Priority-present scenarios. Readable cell values were exact allowed English labels: grouped-long `High 3 / Normal 3 / empty-or-unreadable 24`; ungrouped `High 7 / empty-or-unreadable 23`. A readable Priority cell used the same allowed label as `aria-label`, with only `aria-label`, `data-garden-id`, and `data-garden-version` attributes; its only dataset key was `gardenVersion`. No icon, badge, role, or other locale-independent Priority value signal was present.
- interpretation: In the observed English shell, the permitted fallback is the exact `Priority` header and exact English value labels; an empty or unreadable cell is not inferred as a priority.
- fallback: Return an explicit unreadable state rather than guessing. Supporting another locale requires a separate evidence matrix.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`

## Ledger Entry: priority-absence

- id: `priority-absence`
- question: Does a genuine Priority-absent view retain the proven ticket-table shape while omitting the Priority header and cells?
- scope: `English path`
- status: `verified`
- probe: `(() => { const table=document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); const headers=[...table.querySelectorAll('[data-garden-id="tables.header_cell"]')]; return { tableCount:document.querySelectorAll('table[data-garden-id="tables.table"][data-test-id="generic-table"]').length, ticketRows:table.querySelectorAll('[data-garden-id="tables.row"][data-test-id="generic-table-row"]').length, groupRows:table.querySelectorAll('[data-garden-id="tables.group_row"][data-test-id="generic-table-rows-group-by"]').length, headerCount:headers.length, hasPriority:headers.some(cell=>cell.textContent.trim()==='Priority') }; })()`
- evidence: The dedicated absence scenario retained exactly one proven ticket table with 30 ticket rows, 0 group rows, and 6 headers, while `hasPriority` was false. The two presence controls each returned `hasPriority: true` at header index 6.
- interpretation: This is genuine column absence in the observed control, not a failed table selector. Absence is not generalized beyond this scenario.
- fallback: Diagnose Priority as absent only after the proven ticket table and header collection succeed; otherwise report a structural/read failure.
- scenario: `priority-absent`

## Ledger Entry: ticket-vs-group-rows

- id: `ticket-vs-group-rows`
- question: Which structural differences distinguish ticket rows from group rows without reading tenant content?
- scope: `English path`
- status: `verified`
- probe: `([...table.querySelectorAll('[data-garden-id="tables.row"], [data-garden-id="tables.group_row"]')].map(row=>({ tag:row.tagName, garden:row.getAttribute('data-garden-id'), test:row.getAttribute('data-test-id'), role:row.getAttribute('role'), cells:row.children.length })))`
- evidence: Ticket rows were `TR`, `tables.row`, `generic-table-row`, role `row`, with 15 direct cells in the grouped-long scenario. The group row was `TR`, `tables.group_row`, `generic-table-rows-group-by`, no role, with 1 direct cell. Both ungrouped scenarios had 30 ticket rows and 0 group rows; the Priority-absent scenario had 6 direct cells per ticket row.
- interpretation: Select ticket rows positively with the paired row identifiers; do not infer row type from text or from position inside `TBODY`.
- fallback: If the paired identifiers disappear, require a matrix-tested structural predicate that excludes one-cell group rows before applying any tint.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`, `priority-absent`

## Ledger Entry: scrolling-and-recycling

- id: `scrolling-and-recycling`
- question: At separated positions in a long view, are rows removed or recycled?
- scope: `English path`
- status: `disproved`
- probe: `(() => { const rows=[...table.querySelectorAll('[data-garden-id="tables.row"][data-test-id="generic-table-row"]')]; const marker=document.querySelector('[data-zhroma-probe="1"]'); return { ticketRows:rows.length, groupRows:table.querySelectorAll('[data-garden-id="tables.group_row"]').length, scrollTop:scroller.scrollTop, maxScroll:scroller.scrollHeight-scroller.clientHeight, markerCount:document.querySelectorAll('[data-zhroma-probe="1"]').length, markerConnected:Boolean(marker && document.contains(marker)), firstVisibleIndex:rows.findIndex(isVisible), lastVisibleIndex:rows.findLastIndex(isVisible) }; })()`
- evidence: The grouped-long scroller measured `clientHeight 594 / scrollHeight 1493 / maxScroll 899`. At the bottom it retained 30 ticket rows and 1 group row; visible ticket indexes were 18 through 29, while the marked first ticket row remained connected but offscreen and marker count remained 1. Earlier separated-position inspection also returned the same 30-ticket/1-group DOM collection.
- interpretation: Row-window virtualization or recycling is disproved for the observed 30-row page: offscreen rows remain mounted. Pagination still exists, so this does not prove behavior across pages or future shell versions.
- fallback: Re-derive visible rows with element-agnostic selectors after debounced child-list mutations; never depend on a stored row object across sort, refresh, or pagination.
- scenario: `priority-present-grouped-long`

## Ledger Entry: painting-element

- id: `painting-element`
- question: Which element paints the normal visible ticket-row background: row, cells, inner wrapper, or ancestor?
- scope: `English path`
- status: `verified`
- probe: `(() => { const row=document.querySelector('[data-zhroma-probe="1"]'); const cells=[...row.children].map(cell=>({ tag:cell.tagName, garden:cell.getAttribute('data-garden-id'), backgroundColor:getComputedStyle(cell).backgroundColor, backgroundImage:getComputedStyle(cell).backgroundImage })); const chain=[]; for(let node=row;node;node=node.parentElement){ const style=getComputedStyle(node); chain.push({ tag:node.tagName, garden:node.getAttribute('data-garden-id'), backgroundColor:style.backgroundColor, backgroundImage:style.backgroundImage }); if(style.backgroundColor==='rgb(255, 255, 255)') break; } return { row:{ backgroundColor:getComputedStyle(row).backgroundColor, backgroundImage:getComputedStyle(row).backgroundImage }, cells, chain }; })()`
- evidence: The ticket `TR` and every direct `TD[data-garden-id="tables.cell"]` returned `background-color: rgba(0, 0, 0, 0)` and `background-image: none`; `TBODY`, `TABLE`, and intermediate wrappers were also transparent. The first opaque surface in the ancestor chain was `DIV[data-garden-id="pane"]` with `rgb(255, 255, 255)`. No screenshot was retained because textual computed-style evidence established the paint stack.
- interpretation: The pane paints the normal white surface; row and cell boxes are transparent. A future tint must be scoped to the proven ticket cells (or equivalently proven transparent row) rather than changing the shared pane. The cell selector is the conservative containment seam because it cannot paint group rows when reached from a positively matched ticket row.
- fallback: Apply only a translucent declarative color to the direct cells of a proven ticket row, then verify native interaction states; block if cells become opaque or native states are suppressed.
- scenario: `priority-present-grouped-long`

## Ledger Entry: sticky-header-state

- id: `sticky-header-state`
- question: Which element owns sticky header geometry and paint?
- scope: `English path`
- status: `verified`
- probe: `([...table.querySelectorAll('thead [data-garden-id="tables.header_cell"]')].map(cell=>({ position:getComputedStyle(cell).position, top:getComputedStyle(cell).top, zIndex:getComputedStyle(cell).zIndex, backgroundColor:getComputedStyle(cell).backgroundColor })))`
- evidence: Every observed header cell returned `position: sticky`, `top: 0px`, `z-index: 1`, and opaque white paint. The containing table retained its own `THEAD`; no duplicate header table appeared.
- interpretation: Sticky geometry and paint belong to each header cell, not the row body or a sibling table. Ticket tint must not target header cells or their stacking context.
- fallback: Restrict tint selectors to `TBODY` ticket rows and direct ticket cells; re-run geometry checks if header topology changes.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`, `priority-absent`

## Ledger Entry: interaction-and-sticky-states

- id: `interaction-and-sticky-states`
- question: Did the user-controlled interaction seam yield hover and selected-row computed-paint evidence sufficient to validate the proposed translucent tint?
- scope: `English path`
- status: `verified`
- probe: `(() => { const table=document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); const rows=[...table.querySelectorAll('tr[data-garden-id="tables.row"][data-test-id="generic-table-row"]')]; const selected=rows.filter(row=>row.getAttribute('aria-selected')==='true'); const hovered=rows.filter(row=>row.matches(':hover')); const normal=rows.find(row=>!selected.includes(row)&&!hovered.includes(row)); const pane=table.closest('[data-garden-id="pane"]'); const css=node=>{ if(!node)return null; const style=getComputedStyle(node); return { backgroundColor:style.backgroundColor, backgroundImage:style.backgroundImage, borderBottomColor:style.borderBottomColor, boxShadow:style.boxShadow }; }; const cells=row=>row ? [...row.children].map(css) : []; return { englishShell:document.documentElement.lang==='en', ticketRows:rows.length, selectedRows:selected.length, hoveredRows:hovered.length, selectedAndHoveredDistinct:Boolean(selected[0]&&hovered[0]&&selected[0]!==hovered[0]), normalRowExists:Boolean(normal), selectedAriaSelected:selected[0]?.getAttribute('aria-selected')??null, hoveredAriaSelected:hovered[0]?.getAttribute('aria-selected')??null, normal:{ row:css(normal), directCells:cells(normal) }, hover:{ row:css(hovered[0]), directCells:cells(hovered[0]) }, selected:{ row:css(selected[0]), directCells:cells(selected[0]), firstSelectableCell:css(selected[0]?.querySelector(':scope > [data-garden-id="tables.cell"]')) }, pane:css(pane) }; })()`
- evidence: The resumed read-only evaluation returned `englishShell: true`, 30 ticket rows, 1 selected row, and 1 hovered row in the same grouped-long table. The selected and hovered rows were distinct, and a separate normal row existed. The selected row returned `aria-selected: true`; the hovered row returned `aria-selected: false`. The normal row had transparent color, no background image, and bottom border `rgb(232, 234, 236)`; its direct cells were transparent. The hovered `TR[data-garden-id="tables.row"][data-test-id="generic-table-row"]` had `rgba(31, 115, 183, 0.08)` color, no background image, bottom border `rgba(31, 115, 183, 0.16)`, and no box shadow; its direct cells were transparent. The selected row with the same selector had `rgba(31, 115, 183, 0.16)` color, no background image, bottom border `rgb(204, 224, 241)`, and no box shadow; its direct cells were transparent, while its first selectable cell added inset box shadow `rgb(31, 115, 183) 3px 0px 0px 0px`. No ticket text, customer data, tenant hostname, credentials, cookies, raw HTML, raw paths, or screenshots were captured or recorded.
- interpretation: In this observed English current Agent Workspace tab, the ticket `TR[data-garden-id="tables.row"][data-test-id="generic-table-row"]` owns distinct native hover and selection paint; selection also adds an inset indicator on the first selectable cell. This establishes the interaction composition input only for this scenario and does not authorize a cross-locale, legacy-shell, vanity-domain, account-plan, or final Phase 2 conclusion.
- fallback: Keep the final Phase 1 verdict blocked until Plan 01-08 evaluates every gate. If a future observed shell no longer yields positive distinct states or the row ceases to own their paint, fail quiet and repeat the sanitized interaction comparison before tinting.
- selected-row-count: `1`
- hovered-row-count: `1`
- normal-paint: `row=color:rgba(0, 0, 0, 0),image:none|direct-cells=color:rgba(0, 0, 0, 0),image:none|pane=color:rgb(255, 255, 255),image:none`
- hover-paint: `row=color:rgba(31, 115, 183, 0.08),image:none|direct-cells=color:rgba(0, 0, 0, 0),image:none|pane=color:rgb(255, 255, 255),image:none`
- selected-paint: `row=color:rgba(31, 115, 183, 0.16),image:none|direct-cells=color:rgba(0, 0, 0, 0),image:none|pane=color:rgb(255, 255, 255),image:none`
- actual-paint-owner: `row`
- interaction-owner: `user`
- scenario: `priority-present-grouped-long`

## Ledger Entry: inert-attribute-survival

- id: `inert-attribute-survival`
- question: Does an inert `data-zhroma-probe` attribute survive row replacement triggered by sort or refresh?
- scope: `English path`
- status: `disproved`
- probe: `(() => { const table=document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); const headers=[...table.querySelectorAll('[data-garden-id="tables.header_cell"]')]; const rows=[...table.querySelectorAll('[data-garden-id="tables.row"][data-test-id="generic-table-row"]')]; const first=rows[0]; return { markerCount:document.querySelectorAll('[data-zhroma-probe="1"]').length, headerCount:headers.length, priorityIndex:headers.findIndex(cell=>cell.textContent.trim()==='Priority'), ticketRows:rows.length, groupRows:table.querySelectorAll('[data-garden-id="tables.group_row"][data-test-id="generic-table-rows-group-by"]').length, firstRowCells:first.children.length, ownerDocumentMatches:first.ownerDocument===document, documentContains:document.contains(first), rootIsDocument:first.getRootNode()===document }; })()`
- evidence: Before interaction, exactly one marker existed on a connected `TR[data-garden-id="tables.row"][data-test-id="generic-table-row"]` at sanitized zero-based ticket-row index 0, with 15 direct cells, Priority header index 6, and allowed Priority label `High`; owner-document, containment, and Document-root checks were true. After the user alone sorted Priority once and refreshed once, marker count was 0 while the current table remained structurally valid with 15 headers, Priority at index 6, 30 ticket rows, 1 group row, and a connected 15-cell first ticket row in the current Document. The user confirmed no operational view, ticket, or account configuration changed.
- interpretation: Survival is disproved across the requested sort-plus-refresh sequence. The refresh removed the temporary page-local attribute, so there is no marker left to clean up and downstream logic must re-stamp from current DOM state rather than retain node identity.
- fallback: Treat page-local attributes as ephemeral and stamp idempotently after child-list changes.
- scenario: `priority-present-grouped-long`

## Ledger Entry: english-language-signal

- id: `english-language-signal`
- question: Which observed document signal identifies the current English agent UI without implying cross-locale correctness?
- scope: `English path`
- status: `verified`
- probe: `({ htmlLang:document.documentElement.lang || null, bodyLang:document.body?.getAttribute('lang') ?? null })`
- evidence: All three scenarios returned `htmlLang: "en"` and `bodyLang: null`; exact English `Priority`, `Urgent`, `High`, `Normal`, and `Low` labels remain a deliberately English-only fallback.
- interpretation: `html[lang="en"]` is the observed shell signal. It does not establish locale-independent Priority parsing.
- fallback: If `html.lang` is absent or not English, return unsupported/unreadable rather than interpreting English labels.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`, `priority-absent`

## Ledger Entry: current-host-coverage

- id: `current-host-coverage`
- question: Does the observed current Agent Workspace use HTTPS on a Zendesk subdomain under `/agent/`, and where is the ticket list framed?
- scope: `English path`
- status: `verified`
- probe: `({ https:location.protocol==='https:', zendeskSubdomain:location.hostname.endsWith('.zendesk.com'), agentFilterPath:/^\/agent\/filters\/[^/]+$/.test(location.pathname), topFrame:window===window.top })`
- evidence: All three scenarios returned `https: true`, `zendeskSubdomain: true`, `agentFilterPath: true`, and `topFrame: true`. The hostname and opaque view identifier were not recorded.
- interpretation: Coverage is proven only for the observed current Agent Workspace deployment shape.
- fallback: Do not claim support for vanity domains, legacy shells, or different path shapes until separately observed.
- scenario: `priority-present-grouped-long`, `priority-present-ungrouped`, `priority-absent`

## Ledger Entry: translated-priority-strings

- id: `translated-priority-strings`
- question: What translated strings represent the Priority header and its values outside English?
- scope: `Localization only`
- status: `outside English-only scope`
- probe: `Not run in Phase 1 by D-05; no translated interface is opened for this spike.`
- evidence: D-05 explicitly limits reconnaissance to the English agent UI.
- interpretation: Translated strings remain untested and no cross-locale compatibility claim is made.
- fallback: A later localization phase must collect independently sanitized evidence before supporting additional languages.
- scenario: `not-run-localization-only`

## Ledger Entry: cross-locale-behavior

- id: `cross-locale-behavior`
- question: Does DOM topology, priority representation, and language signaling remain stable across Zendesk agent locales?
- scope: `Localization only`
- status: `outside English-only scope`
- probe: `Not run in Phase 1 by D-05; cross-locale comparison is deliberately excluded.`
- evidence: D-05 records cross-locale behavior as deferred rather than verified.
- interpretation: English-path evidence cannot be generalized to another locale.
- fallback: Re-run the complete scenario matrix per supported locale before making a compatibility claim.
- scenario: `not-run-localization-only`

## Authenticated Interaction Handoff

- state: interaction-evidence-complete
- post-action-state: interactions-complete
- capture-date: `2026-09-03`
- shell: `current Agent Workspace`
- plan-label: `unknown/not shared`
- scenario: `priority-present-grouped-long`
- marker-selector: `[data-zhroma-probe="1"]`
- baseline: Exactly one marker is attached to a connected ticket `TR` at sanitized zero-based row index 0; it has 15 direct cells, Priority header index 6, allowed Priority label `High`, the current owner document, and a direct Document root.
- next-action-owner: `none`
- next-action: The Plan 04 interaction seam is closed. Any future hover/selection comparison requires a new explicit human-controlled seam.
- post-action-inspection: Marker count was 0 after the user-controlled sort and refresh. The refreshed table retained 15 headers, Priority at index 6, 30 ticket rows, 1 group row, and direct current-Document reachability. The temporary page-local marker therefore required no additional cleanup.
- post-action-interaction-inspection: The current grouped-long table had 0 selected rows and 0 hovered rows, so no native hover/selection paint comparison was available for admission.
- user-confirmation: `interactions complete — no operational view, ticket, or account configuration changed`
- safety: The user alone performed the authenticated sort and refresh in the non-operational recon view; no ticket or account configuration was changed.

## Admitted Fixture Corpus

- capture scenarios: `priority-present-ungrouped`, `priority-absent`, and `grouped-long`.
- boundary: Each fixture is a live-derived projection of the immediate overflow wrapper and its complete ticket table; navigation, sidebars, menus, pagination controls, and unrelated state are excluded.
- structural fidelity: The canonical fixture retains 16 headers and 4 ticket-row topologies normalized to the four allowed Priority labels; the absence control retains 6 headers, 4 ticket rows, and no seventh header cell or allowed Priority value; the grouped-long fixture retains the same-table sticky-header topology, 1 group row, and 12 ordered ticket-row topologies from the observed 30-row scrollable table.
- admission: The corpus was re-admitted through `scripts/sanitize-fixture.js` from previously sanitized repository bytes; this was not a fresh live capture. The prior admission record states that private inputs were deleted. Re-admission removed invalid ARIA stand-ins, restored the recorded Priority header in two fixtures, and renumbered deterministic text tokens with user approval. Original bytes and hashes remain in Git history; every re-admitted fixture passed an identical second sanitizer pass.
- verification: `test/fixtures/manifest.json` binds the three scenario assertions and selectors to exact final-byte SHA-256 values. The repository corpus gate performs sensitive scanning before detached parsing, then enforces shared sanitized-output grammar, canonical file uniqueness, selectors, topology, scenario invariants, and checksums. Each manifest entry also has a byte-identical sanitizer round-trip test.
- scope: These fixtures cover only the English current Agent Workspace shell observed on 2026-09-03 with account plan unknown/not shared. They make no legacy-shell, vanity-domain, cross-plan, or localization claim.

## Execution Safety Note

During an earlier local probe attempt, an unintended read-only ticket navigation
occurred. Browser Back immediately restored the originating view; no ticket or
account mutation was performed and no identifying content was persisted. Native
keyboard injection was abandoned after that recovery. The reversible magenta
style mutation was not repeated through that unsafe path; the exact computed
paint chain above supplied textual evidence without retaining a visual capture.

## Recon 2 Session Handoff

- session-state: `admitted`
- next-step: `admission`
- next-action-owner: `user`
- capture-date: `2026-09-27`
- shell: `current Agent Workspace`
- plan-label: `unknown/not shared`
- probe-path: `claude-in-chrome`
- zhroma-switch-original: `on`
- appearance-original: `dark`
- os-appearance-original: `auto`
- restore: `complete`
- recon-views-deleted: `pending`
- private-inputs: `retained-for-admission`
- safety: The user performs every click, menu opening, setting change, hover, checkbox selection, Tab press and view creation or deletion; Claude runs only the read-only probes in 06-RUN-SHEET.md plus temporary data-zhroma-probe markers, and nothing identifying is recorded (D-03, D-04).
- operator-deviation: At the user's explicit request on 2026-09-26, Claude drove the Zendesk interface through Claude in Chrome (menus, the personal view, hover, selection, Tab), so D-03 was waived for this session and screenshots and page reads entered the conversation transcript (D-04 waived for the transcript only). The OS appearance and the Zhroma switch stayed with the user. Chrome ran on a different machine from the repository, so each stash reached the private directory as a browser download that the user moved across; the raw markup never passed through the conversation. At the user's request Claude wrote the private denylist outside every checkout. Beyond the run-sheet probes, Claude ran allowlist-only and count-only supplementary probes (header and value vocabulary, date titles) and reloaded the view once. Nothing identifying is recorded in this ledger, the manifest or any fixture.

## Recon 2 Entry: dark-mode-signal

- id: `dark-mode-signal`
- question: Which document-level signal (an html or body attribute, a class token, or the computed color-scheme) or which surface luminance distinguishes Zendesk Light, Dark and Match system, with the OS set explicitly to light and to dark?
- scope: `English path`
- status: `verified`
- probe: `(() => { const html = document.documentElement; const body = document.body; const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); const pane = table?.closest('[data-garden-id="pane"]'); const header = table?.querySelector('thead [data-garden-id="tables.header_cell"]'); const cell = table?.querySelector('tbody tr[data-garden-id="tables.row"][data-test-id="generic-table-row"] > [data-garden-id="tables.cell"]'); const style = (element) => (element ? getComputedStyle(element) : null); const MODE = /dark|light|theme|scheme|mode/i; const modeTokens = (element) => [...element.classList].filter((token) => MODE.test(token)); const modeValues = (element) => element.getAttributeNames().filter((name) => /^(light|dark|system|auto)$/i.test(element.getAttribute(name) ?? '')).map((name) => name + '=' + element.getAttribute(name).toLowerCase()); return { htmlColorScheme: style(html).colorScheme, bodyColorScheme: style(body).colorScheme, metaColorScheme: document.querySelector('meta[name="color-scheme"]')?.getAttribute('content') ?? null, htmlAttributeNames: html.getAttributeNames(), bodyAttributeNames: body.getAttributeNames(), htmlModeClassTokens: modeTokens(html), bodyModeClassTokens: modeTokens(body), modeAttributeValues: [...modeValues(html), ...modeValues(body)], prefersDark: matchMedia('(prefers-color-scheme: dark)').matches, paneBackground: style(pane)?.backgroundColor ?? null, headerCellBackground: style(header)?.backgroundColor ?? null, headerCellText: style(header)?.color ?? null, ticketCellText: style(cell)?.color ?? null, zhromaStamps: document.querySelectorAll('[data-zhroma-priority]').length }; })()`
- evidence: P3-appearance-cell read all six cells on 2026-09-27 with Zhroma switched off (zhromaStamps 0 in every reading). Zendesk Appearance was set through the profile menu; the OS on the machine running Chrome was set by the user explicitly to Light or Dark before each cell, never Auto, and prefersDark matched each reported OS mode. In every cell html carried data-theme and data-color-scheme equal to the mode Zendesk painted, computed color-scheme stayed normal on html and body, and no meta color-scheme existed. The class-token fields came back redacted by the browser tool, so no class token is claimed. Light surfaces read pane rgb(255, 255, 255), header rgb(255, 255, 255) on rgb(41, 50, 57), cell text rgb(41, 50, 57); dark surfaces read pane rgb(21, 26, 30), header rgb(21, 26, 30) on rgb(216, 220, 222), cell text rgb(216, 220, 222). The Match system cells were read when Match system was selected; a live OS toggle under Match system left the page dark until the next load (see dark-mode-switch-mutation). The Appearance selection itself reset to Light mode after a page reload and after a re-login, observed twice.
- interpretation: Phase 8 takes the ARCHITECTURE section 4 document-marker branch: read html[data-theme] (light or dark; data-color-scheme mirrors it) as Zendesk's own signal. It tracked the painted surface in every reading, including the stale one after a live OS toggle, while prefers-color-scheme disagreed with the painted surface in the dark/os-light and light/os-dark cells and after that toggle, so it is never the signal. Computed color-scheme is always normal and cannot be used. The measured light and dark surfaces above are Phase 8's palette inputs.
- fallback: If Appearance is not offered, Phase 8 is blocked (D-24); if there is no document marker and no readable surface, Phase 8 falls back to light (DARK-05).
- scenario: `appearance-matrix`
- dark-mode-offered: `yes`
- dark-branch: `document-marker`
- os-auto-used: `no`
- zhroma-off: `yes`
- cell-light-os-light: effective light; html data-theme light, data-color-scheme light; color-scheme normal; no meta; prefersDark false; pane rgb(255, 255, 255); header rgb(255, 255, 255) on rgb(41, 50, 57); cell text rgb(41, 50, 57)
- cell-light-os-dark: effective light; html data-theme light, data-color-scheme light; color-scheme normal; no meta; prefersDark true; pane rgb(255, 255, 255); header rgb(255, 255, 255) on rgb(41, 50, 57); cell text rgb(41, 50, 57)
- cell-dark-os-light: effective dark; html data-theme dark, data-color-scheme dark; color-scheme normal; no meta; prefersDark false; pane rgb(21, 26, 30); header rgb(21, 26, 30) on rgb(216, 220, 222); cell text rgb(216, 220, 222)
- cell-dark-os-dark: effective dark; html data-theme dark, data-color-scheme dark; color-scheme normal; no meta; prefersDark true; pane rgb(21, 26, 30); header rgb(21, 26, 30) on rgb(216, 220, 222); cell text rgb(216, 220, 222)
- cell-match-os-light: effective light, read when Match system was selected with the OS on Light; html data-theme light, data-color-scheme light; color-scheme normal; no meta; prefersDark false; pane rgb(255, 255, 255); header rgb(255, 255, 255) on rgb(41, 50, 57); cell text rgb(41, 50, 57); after a live OS toggle from Dark without a reload the page had stayed data-theme dark with dark surfaces
- cell-match-os-dark: effective dark; html data-theme dark, data-color-scheme dark; color-scheme normal; no meta; prefersDark true; pane rgb(21, 26, 30); header rgb(21, 26, 30) on rgb(216, 220, 222); cell text rgb(216, 220, 222)

## Recon 2 Entry: dark-mode-switch-mutation

- id: `dark-mode-switch-mutation`
- question: Does a mid-session switch (Light to Dark, Dark to Light, and an OS toggle under Match system) swap an attribute or class, change only the CSSOM, re-mount the table, reload the page, or cause no mutation?
- scope: `English path`
- status: `verified`
- probe: `(() => { const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); if (!table) return { installed: false, table: false }; window.zhromaReconTwo?.observer?.disconnect(); const ruleCount = () => [...document.styleSheets].reduce((total, sheet) => { try { return total + sheet.cssRules.length; } catch { return total; } }, 0); const counts = { html: {}, head: {}, body: {}, table: {} }; const bump = (key, type, name) => { const bucket = counts[key]; bucket[type] = (bucket[type] ?? 0) + 1; if (name) bucket.attributeNames = [...new Set([...(bucket.attributeNames ?? []), name])]; }; const where = (target) => (target === document.documentElement ? 'html' : target === document.body ? 'body' : document.head.contains(target) ? 'head' : 'table'); table.setAttribute('data-zhroma-probe', 'recon-two-table'); document.documentElement.setAttribute('data-zhroma-probe', 'recon-two-sentinel'); const observer = new MutationObserver((records) => records.forEach((record) => bump(where(record.target), record.type, record.attributeName))); observer.observe(document.documentElement, { attributes: true }); observer.observe(document.head, { childList: true, subtree: true, attributes: true }); observer.observe(document.body, { attributes: true, childList: true }); observer.observe(table, { attributes: true, childList: true, subtree: true }); window.zhromaReconTwo = { observer, counts, ruleCount, rules: ruleCount(), sheets: document.styleSheets.length, installedAt: Date.now() }; return { installed: true, rules: window.zhromaReconTwo.rules, sheets: window.zhromaReconTwo.sheets }; })() ;; (() => { const recorder = window.zhromaReconTwo; if (!recorder || document.documentElement.getAttribute('data-zhroma-probe') !== 'recon-two-sentinel') return { baseline: false, recorderVisible: Boolean(recorder) }; const noise = JSON.parse(JSON.stringify(recorder.counts)); Object.keys(recorder.counts).forEach((key) => { recorder.counts[key] = {}; }); recorder.baseline = { counts: noise, seconds: Math.round((Date.now() - recorder.installedAt) / 1000), ruleDelta: recorder.ruleCount() - recorder.rules, sheetDelta: document.styleSheets.length - recorder.sheets }; recorder.rules = recorder.ruleCount(); recorder.sheets = document.styleSheets.length; recorder.switchStartedAt = Date.now(); return { baseline: true, ...recorder.baseline }; })() ;; (() => { const recorder = window.zhromaReconTwo; const sentinel = document.documentElement.getAttribute('data-zhroma-probe') === 'recon-two-sentinel'; if (!sentinel) return { reloaded: true, recorderVisible: Boolean(recorder) }; if (!recorder) return { reloaded: false, recorderVisible: false }; recorder.observer.disconnect(); const marked = document.querySelector('[data-zhroma-probe="recon-two-table"]'); const current = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); const result = { reloaded: false, recorderVisible: true, tableRemounted: !marked || marked !== current, seconds: Math.round((Date.now() - (recorder.switchStartedAt ?? recorder.installedAt)) / 1000), ruleDelta: recorder.ruleCount() - recorder.rules, sheetDelta: document.styleSheets.length - recorder.sheets, counts: recorder.counts, baseline: recorder.baseline ?? null }; marked?.removeAttribute('data-zhroma-probe'); document.documentElement.removeAttribute('data-zhroma-probe'); delete window.zhromaReconTwo; return JSON.parse(JSON.stringify(result)); })()`
- evidence: Each switch had a 20-second quiet baseline with zero records on html, head, body and the table and a rule and sheet delta of 0. Switch A, Light to Dark with the OS Light (33-second window): html 7 attribute records (class, data-color-scheme, data-theme), table 228 attribute records (class), head and body 0, stylesheet rules plus 625, sheets 0, reloaded false, tableRemounted false. Switch B, Dark to Light with the OS Dark (30-second window): html 7 attribute records (class, data-color-scheme, data-theme), table 228 attribute records (class), head and body 0, rules plus 21, sheets 0, reloaded false, tableRemounted false. Switch C, OS Dark to Light under Match system (626-second window): html, head and body 0, table 16 childList records (live row updates) and no attribute records, rules 0, sheets 0, reloaded false, tableRemounted false; the page stayed data-theme dark with dark surfaces while prefersDark had become false.
- interpretation: Phase 8 re-evaluates on html attribute changes (data-theme, data-color-scheme, class): an in-app Appearance switch swaps them in place, inserts styled-components rules into the CSSOM and swaps classes on table cells, with no reload and no table re-mount. An OS toggle under Match system changes nothing until the next page load, so a palette that followed prefers-color-scheme would disagree with Zendesk's painted surface; following data-theme stays correct in both cases.
- fallback: Phase 8 re-evaluates the dark signal on load and on every observed html, body or stylesheet change; a switch that could not be observed leaves Phase 8 to re-read the signal on reload only.
- scenario: `appearance-matrix`
- switch-light-to-dark: `attribute-or-class-swap`
- switch-dark-to-light: `attribute-or-class-swap`
- switch-os-under-match: `no-mutation`

## Recon 2 Entry: dark-native-states

- id: `dark-native-states`
- question: In Zendesk Dark with Zhroma off, what are the computed normal, hovered and checkbox-selected row paints, the sticky-header and pane paints, and the focus indicator reached with Tab only?
- scope: `English path`
- status: `verified`
- probe: `(() => { const table=document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); const rows=[...table.querySelectorAll('tr[data-garden-id="tables.row"][data-test-id="generic-table-row"]')]; const selected=rows.filter(row=>row.getAttribute('aria-selected')==='true'); const hovered=rows.filter(row=>row.matches(':hover')); const normal=rows.find(row=>!selected.includes(row)&&!hovered.includes(row)); const pane=table.closest('[data-garden-id="pane"]'); const css=node=>{ if(!node)return null; const style=getComputedStyle(node); return { backgroundColor:style.backgroundColor, backgroundImage:style.backgroundImage, borderBottomColor:style.borderBottomColor, boxShadow:style.boxShadow }; }; const cells=row=>row ? [...row.children].map(css) : []; return { englishShell:document.documentElement.lang==='en', ticketRows:rows.length, selectedRows:selected.length, hoveredRows:hovered.length, selectedAndHoveredDistinct:Boolean(selected[0]&&hovered[0]&&selected[0]!==hovered[0]), normalRowExists:Boolean(normal), selectedAriaSelected:selected[0]?.getAttribute('aria-selected')??null, hoveredAriaSelected:hovered[0]?.getAttribute('aria-selected')??null, normal:{ row:css(normal), directCells:cells(normal) }, hover:{ row:css(hovered[0]), directCells:cells(hovered[0]) }, selected:{ row:css(selected[0]), directCells:cells(selected[0]), firstSelectableCell:css(selected[0]?.querySelector(':scope > [data-garden-id="tables.cell"]')) }, pane:css(pane) }; })() ;; (() => { const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); if (!table) return { table: false }; return [...table.querySelectorAll('thead [data-garden-id="tables.header_cell"]')].map((cell) => { const style = getComputedStyle(cell); return { position: style.position, top: style.top, zIndex: style.zIndex, backgroundColor: style.backgroundColor, color: style.color }; }); })() ;; (() => { const active = document.activeElement ?? document.body; const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); const style = getComputedStyle(active); const row = active.closest('tr'); return { inTable: Boolean(table?.contains(active)), tag: active.tagName, garden: active.getAttribute('data-garden-id'), test: active.getAttribute('data-test-id'), focusVisible: active.matches(':focus-visible'), outline: style.outlineStyle + ' ' + style.outlineWidth + ' ' + style.outlineColor + ' offset ' + style.outlineOffset, boxShadow: style.boxShadow, rowBoxShadow: row ? getComputedStyle(row).boxShadow : null, rowBackground: row ? getComputedStyle(row).backgroundColor : null }; })()`
- evidence: Zendesk Dark, Zhroma off, 30 ticket rows: 1 checkbox-selected row (aria-selected true) and 1 distinct hovered row (aria-selected false) plus normal rows. Normal row color rgba(0, 0, 0, 0), no image, bottom border rgb(41, 50, 57); hovered row rgba(102, 160, 205, 0.08), bottom border rgba(102, 160, 205, 0.16), no box shadow; selected row rgba(102, 160, 205, 0.16), bottom border rgb(15, 54, 85), and its first selectable cell adds inset box shadow rgb(38, 148, 214) 3px 0px 0px 0px; every direct cell of all three rows is transparent. Pane rgb(21, 26, 30). All 18 header cells are position sticky, top 0px, z-index 1, background rgb(21, 26, 30), text rgb(216, 220, 222). Focus: after a mouse click on the selected row's checkbox, one Tab press (no Enter or Space) moved focus to the subject link of that row (A, buttons.anchor, inside the table) with focus-visible true, outline solid 2px rgb(38, 148, 214) offset 1px and no box shadow; the page stayed on the view.
- interpretation: In dark mode the ticket row still owns native hover and selection paint, now translucent blue over the dark pane, and cells stay transparent, so Phase 8's row-plus-cell translucent tint composes the same way it does in light mode. Selection keeps the inset first-cell indicator. Header cells own sticky paint and stay out of the tint. Keyboard focus shows as an outline on the focused link, not a row box shadow, so a row tint does not hide it.
- fallback: If focus cannot be observed safely with Tab only, Phase 8 leaves the native focus indicator untouched and checks it in its own acceptance (D-18); unobserved hover or selection paint leaves Phase 8 on its translucent default.
- scenario: `dark-rule-view`
- zhroma-off: `yes`
- hover-selection-observed: `yes`
- focus-observed: `yes`

## Recon 2 Entry: dark-table-topology

- id: `dark-table-topology`
- question: Do the v1 Garden table, header, row and cell identifiers and the Document-only root chain still hold in Zendesk Dark?
- scope: `English path`
- status: `verified`
- probe: `(() => { const table = document.querySelector('table[data-garden-id="tables.table"]') ?? document.querySelector('table'); if (!table) return { table: false, tables: 0 }; const boundary = table.parentElement ?? table; const result = { tables: document.querySelectorAll('table').length, 'data-garden-id': {}, 'data-test-id': {}, digitBearing: 0 }; for (const element of boundary.querySelectorAll('[data-garden-id], [data-test-id]')) { for (const name of ['data-garden-id', 'data-test-id']) { const value = element.getAttribute(name); if (!value) continue; if (/\d/.test(value)) { result.digitBearing += 1; continue; } result[name][value] = (result[name][value] ?? 0) + 1; } } const has = (selector) => table.matches(selector) || Boolean(table.querySelector(selector)); result.holds = { table: table.matches('[data-garden-id="tables.table"][data-test-id="generic-table"]'), head: has('[data-garden-id="tables.head"][data-test-id="generic-table-head"]'), body: has('[data-garden-id="tables.body"][data-test-id="generic-table-body"]'), row: has('[data-garden-id="tables.row"][data-test-id="generic-table-row"]'), groupRowSelector: 'tables.group_row', headerCell: has('[data-garden-id="tables.header_cell"]'), cell: has('[data-garden-id="tables.cell"]') }; return result; })() ;; (() => { const table = document.querySelector('table[data-garden-id="tables.table"]') ?? document.querySelector('table'); const row = table?.querySelector('tbody tr'); if (!row) return { row: false }; const roots = []; let node = row; while (node) { const root = node.getRootNode(); if (root === node.ownerDocument) { roots.push({ type: 'Document' }); break; } roots.push({ type: 'ShadowRoot', mode: root.mode ?? null, hostTag: root.host?.tagName ?? null }); node = root.host; } return { roots, ownerIsDocument: row.ownerDocument === document, reachable: document.contains(row), ownerFrameTag: row.ownerDocument.defaultView?.frameElement?.tagName ?? null }; })()`
- evidence: Zendesk Dark: 1 table; the holds object returned true for table, head, body, row, header cell and cell (the v1 data-garden-id and data-test-id pairs); within the table wrapper tables.row 30, tables.header_cell 18, tables.cell 540, generic-table-row 30, and 93 digit-bearing identifier values counted but not returned. The sampled ticket row's root chain is Document only, its owner is the top document, it is reachable, and it has no owner frame.
- interpretation: The v1 Garden table identifiers and the Document-only root chain hold unchanged in dark mode, so Phase 8 keeps the v1 selectors and needs no dark-specific topology.
- fallback: If the Garden identifiers differ in dark mode, Phase 8 is blocked and the difference is reported, not worked around (D-19, D-24).
- scenario: `dark-rule-view`
- garden-identifiers: `hold`
- root-terminus: `Document`

## Recon 2 Entry: identity-location

- id: `identity-location`
- question: Where does the signed-in agent's name render (top-bar avatar alt, button aria-label or title, or only inside the opened profile menu), is it present at load or only later, and is it a full or a short form?
- scope: `English path`
- status: `verified`
- probe: `(() => { const N = (value) => (value ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim(); const kindOf = (a, b) => (!a || !b ? 'not-comparable' : a === b ? 'identical' : a.toLowerCase() === b.toLowerCase() ? 'case-only' : a.replace(/\s/gu, '') === b.replace(/\s/gu, '') ? 'whitespace-only' : a.startsWith(b) || b.startsWith(a) ? 'prefix' : 'different'); const plainIdentifier = (value) => (value === null ? null : /^[a-z][a-z._-]*$/.test(value) ? value : 'other'); const words = (value) => (value.split(' ').length > 1 ? 'multi-word' : 'one-word'); const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); if (!table) return { table: false }; const headers = [...table.querySelectorAll('thead [data-garden-id="tables.header_cell"]')]; const assigneeIndex = headers.findIndex((cell) => N(cell.textContent) === 'Assignee'); const rows = [...table.querySelectorAll('tbody tr[data-garden-id="tables.row"][data-test-id="generic-table-row"]')]; const selected = rows.filter((row) => row.getAttribute('aria-selected') === 'true' || row.querySelector('input[type="checkbox"]')?.checked === true); const menuOpen = Boolean(document.querySelector('[role="menu"]')); if (assigneeIndex < 0 || selected.length !== 1) return { table: true, assigneeIndex, selectedRows: selected.length, menuOpen }; const cell = selected[0].children[assigneeIndex]; const cellText = N(cell?.textContent); const labelText = [cell, ...(cell ? cell.querySelectorAll('*') : [])].filter(Boolean).map((element) => N(element.getAttribute('aria-label') ?? element.getAttribute('title') ?? element.getAttribute('alt'))).find(Boolean) ?? ''; const assigneeRenders = cellText && labelText ? 'both' : labelText ? 'avatar-label' : cellText ? 'text' : 'empty'; const assignee = cellText || labelText; const RANK = ['identical', 'case-only', 'whitespace-only', 'prefix']; const scope = 'header, nav, aside, [role="banner"], [role="navigation"], [role="menu"], [role="menuitem"], [role="dialog"], [data-garden-id^="avatars"], [data-test-id*="profile"], [data-test-id*="avatar"], [data-test-id*="user"], button[aria-label], button[title], img[alt]'; const visited = new Set(); const hits = []; let differentCount = 0; for (const root of document.querySelectorAll(scope)) { for (const element of [root, ...root.querySelectorAll('*')]) { if (visited.has(element) || table.contains(element)) continue; visited.add(element); const carriers = [['alt', element.getAttribute('alt')], ['aria-label', element.getAttribute('aria-label')], ['title', element.getAttribute('title')], ['text', element.children.length === 0 ? element.textContent : null]]; for (const [carrier, raw] of carriers) { const value = N(raw); if (!value) continue; const difference = kindOf(value, assignee); if (difference === 'different') { differentCount += 1; continue; } if (!RANK.includes(difference)) continue; hits.push({ element, carrier, difference, wordClass: words(value) }); } } } const describe = (hit) => ({ tag: hit.element.tagName, garden: plainIdentifier(hit.element.getAttribute('data-garden-id')), test: plainIdentifier(hit.element.getAttribute('data-test-id')), role: hit.element.getAttribute('role'), carrier: hit.carrier, difference: hit.difference, wordClass: hit.wordClass, insideMenu: Boolean(hit.element.closest('[role="menu"], [role="dialog"]')), inTopBar: Boolean(hit.element.closest('header, [role="banner"]')), seenInEarlierRun: hit.element.getAttribute('data-zhroma-probe') === 'identity-hit' }); const candidates = hits.map(describe); hits.forEach((hit) => { if (!hit.element.hasAttribute('data-zhroma-probe')) hit.element.setAttribute('data-zhroma-probe', 'identity-hit'); }); return { table: true, assigneeIndex, selectedRows: 1, assigneeRenders, assigneeWordClass: assignee ? words(assignee) : null, menuOpen, candidateCount: candidates.length, candidates: candidates.slice(0, 20), differentCount }; })()`
- evidence: Three P2-identity runs on 2026-09-27, Zendesk Light, with the user's own ticket as the only checkbox-selected row (Assignee at column 8). Run 1, no menu open: 1 candidate, an IMG in the top bar carrying the name in alt, difference identical, multi-word. Run 2, profile menu open: 3 candidates, the same top-bar IMG (seenInEarlierRun true) plus an IMG alt and a DIV typography.font text node inside the menu, all identical and multi-word. Run 3, menu closed again: only the top-bar IMG, already seen in run 1. P2-mark-identity chose the top-bar IMG and marked its enclosing BUTTON (data-garden-id navigation.profile-menu-button, data-test-id toolbar-profile-menu-button, role button, 4 elements, no landmark) as the capture root. The Assignee cell rendered plain text only. The probe's menuOpen flag read true in every run because a hidden role=menu element stays in the document, so presence at load is taken from the run 1 candidate and the seenInEarlierRun markers, not from menuOpen.
- interpretation: Phase 10 can read the signed-in agent's full name at page load from the alt of the avatar image inside the top-bar profile BUTTON (navigation.profile-menu-button), without opening a menu; the opened profile menu repeats the same full form as an IMG alt and a text node. The Assignee cell carries names as plain text with no label attribute.
- fallback: If no name renders anywhere, Phase 10 relies on a typed name (IDENT-03).
- scenario: `light-rule-view`
- identity-source: `top-bar-at-load`
- identity-carrier: `alt`
- identity-form: `full`
- assignee-cell-renders: `text`

## Recon 2 Entry: identity-vs-assignee

- id: `identity-vs-assignee`
- question: Compared inside the page after NFC, whitespace collapse and trim, does the identity string equal the Assignee cell text on the agent's own ticket, and if not, which difference kind applies?
- scope: `English path`
- status: `verified`
- probe: `(() => { const N = (value) => (value ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim(); const kindOf = (a, b) => (!a || !b ? 'not-comparable' : a === b ? 'identical' : a.toLowerCase() === b.toLowerCase() ? 'case-only' : a.replace(/\s/gu, '') === b.replace(/\s/gu, '') ? 'whitespace-only' : a.startsWith(b) || b.startsWith(a) ? 'prefix' : 'different'); const plainIdentifier = (value) => (value === null ? null : /^[a-z][a-z._-]*$/.test(value) ? value : 'other'); const words = (value) => (value.split(' ').length > 1 ? 'multi-word' : 'one-word'); const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); if (!table) return { table: false }; const headers = [...table.querySelectorAll('thead [data-garden-id="tables.header_cell"]')]; const assigneeIndex = headers.findIndex((cell) => N(cell.textContent) === 'Assignee'); const rows = [...table.querySelectorAll('tbody tr[data-garden-id="tables.row"][data-test-id="generic-table-row"]')]; const selected = rows.filter((row) => row.getAttribute('aria-selected') === 'true' || row.querySelector('input[type="checkbox"]')?.checked === true); const menuOpen = Boolean(document.querySelector('[role="menu"]')); if (assigneeIndex < 0 || selected.length !== 1) return { table: true, assigneeIndex, selectedRows: selected.length, menuOpen }; const cell = selected[0].children[assigneeIndex]; const cellText = N(cell?.textContent); const labelText = [cell, ...(cell ? cell.querySelectorAll('*') : [])].filter(Boolean).map((element) => N(element.getAttribute('aria-label') ?? element.getAttribute('title') ?? element.getAttribute('alt'))).find(Boolean) ?? ''; const assigneeRenders = cellText && labelText ? 'both' : labelText ? 'avatar-label' : cellText ? 'text' : 'empty'; const assignee = cellText || labelText; const RANK = ['identical', 'case-only', 'whitespace-only', 'prefix']; const scope = 'header, nav, aside, [role="banner"], [role="navigation"], [role="menu"], [role="menuitem"], [role="dialog"], [data-garden-id^="avatars"], [data-test-id*="profile"], [data-test-id*="avatar"], [data-test-id*="user"], button[aria-label], button[title], img[alt]'; const visited = new Set(); const hits = []; let differentCount = 0; for (const root of document.querySelectorAll(scope)) { for (const element of [root, ...root.querySelectorAll('*')]) { if (visited.has(element) || table.contains(element)) continue; visited.add(element); const carriers = [['alt', element.getAttribute('alt')], ['aria-label', element.getAttribute('aria-label')], ['title', element.getAttribute('title')], ['text', element.children.length === 0 ? element.textContent : null]]; for (const [carrier, raw] of carriers) { const value = N(raw); if (!value) continue; const difference = kindOf(value, assignee); if (difference === 'different') { differentCount += 1; continue; } if (!RANK.includes(difference)) continue; hits.push({ element, carrier, difference, wordClass: words(value) }); } } } const describe = (hit) => ({ tag: hit.element.tagName, garden: plainIdentifier(hit.element.getAttribute('data-garden-id')), test: plainIdentifier(hit.element.getAttribute('data-test-id')), role: hit.element.getAttribute('role'), carrier: hit.carrier, difference: hit.difference, wordClass: hit.wordClass, insideMenu: Boolean(hit.element.closest('[role="menu"], [role="dialog"]')), inTopBar: Boolean(hit.element.closest('header, [role="banner"]')), seenInEarlierRun: hit.element.getAttribute('data-zhroma-probe') === 'identity-hit' }); const candidates = hits.map(describe); hits.forEach((hit) => { if (!hit.element.hasAttribute('data-zhroma-probe')) hit.element.setAttribute('data-zhroma-probe', 'identity-hit'); }); return { table: true, assigneeIndex, selectedRows: 1, assigneeRenders, assigneeWordClass: assignee ? words(assignee) : null, menuOpen, candidateCount: candidates.length, candidates: candidates.slice(0, 20), differentCount }; })()`
- evidence: Compared inside the page after NFC, whitespace collapse and trim, the top-bar IMG alt equals the Assignee cell text of the user's own selected ticket with difference kind identical in all three runs; the in-menu IMG alt and DIV text were identical too. Between 116 and 127 other candidate strings per run were different. No string left the page.
- interpretation: Phase 10 can match the detected identity against Assignee text with plain normalised equality (NFC, whitespace collapse, trim); this tenant needed no case, whitespace or prefix normalisation, so no self-alt form was required.
- fallback: If the two forms are not comparable, Phase 10 relies on a typed name (IDENT-03); a recorded difference kind tells Phase 10 which normalisation to offer.
- scenario: `light-rule-view`
- equal: `true`
- difference-kind: `identical`

## Recon 2 Entry: referenced-cell-representation

- id: `referenced-cell-representation`
- question: How do Assignee, Requester, Group, Status, Type, Subject, Tags, a relative-time date column and a custom dropdown (and a checkbox field, if the tenant has one) render, including empty placeholders and hidden, truncated or aria-label-only text?
- scope: `English path`
- status: `verified`
- probe: `(() => { const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); if (!table) return { table: false }; const N = (value) => (value ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim(); const LABELS = ['Priority', 'Assignee', 'Requester', 'Group', 'Status', 'Type', 'Subject', 'Tags', 'Updated', 'Requester updated', 'Assignee updated', 'Last updated', 'Created', 'Requested', 'Due date', 'Organization', 'ID', 'Satisfaction', 'Channel', 'Brand', 'Ticket form', 'Solved', 'Latest update', 'Requester name', 'Assignee name', 'Group name']; const STATUS = ['New', 'Open', 'Pending', 'On-hold', 'On hold', 'Solved', 'Closed']; const TYPES = ['Question', 'Incident', 'Problem', 'Task']; const PRIORITY = ['Urgent', 'High', 'Normal', 'Low']; const HOLDERS = ['-', '--', '\u2013', '\u2014', 'Unassigned', 'None', '(none)', 'n/a', 'N/A', 'No group']; const VOCABULARY = [...PRIORITY, ...STATUS, ...TYPES, ...HOLDERS]; const RELATIVE = /\b(?:ago|just now|yesterday|today|tomorrow|minutes?|hours?|days?|weeks?|months?|years?)\b/i; const ABSOLUTE = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b|\d{1,2}:\d{2}|\b\d{4}\b|\d{1,2}\/\d{1,2}/; const plainIdentifier = (value) => /^[a-z][a-z._-]*$/.test(value); const bump = (map, key) => { map[key] = (map[key] ?? 0) + 1; }; const shapeOf = (element) => { const style = getComputedStyle(element); if (style.display === 'none') return 'displayNone'; if (style.clip === 'rect(0px, 0px, 0px, 0px)' || style.clipPath === 'inset(50%)' || (style.position === 'absolute' && parseFloat(style.width) <= 1 && parseFloat(style.height) <= 1)) return 'visuallyHidden'; if (style.textOverflow === 'ellipsis' && element.scrollWidth > element.clientWidth) return 'truncated'; return null; }; const headers = [...table.querySelectorAll('thead [data-garden-id="tables.header_cell"]')]; const headerTexts = headers.map((cell) => N(cell.textContent)); const labelCounts = {}; headerTexts.filter(Boolean).forEach((text) => bump(labelCounts, text)); const rows = [...table.querySelectorAll('tbody tr[data-garden-id="tables.row"][data-test-id="generic-table-row"]')]; const columns = headers.map((header, index) => { const text = headerTexts[index]; const facts = { index, label: !text ? 'empty' : LABELS.includes(text) ? text : 'non-standard', labelRepeats: text ? labelCounts[text] : 0, cells: 0, empty: 0, labelOnly: 0, tags: {}, attributeNames: [], identifiers: {}, digitIdentifiers: 0, otherIdentifiers: 0, title: 0, titleEqualsText: 0, alt: 0, altEqualsText: 0, ariaLabel: 0, ariaLabelEqualsText: 0, visuallyHidden: 0, displayNone: 0, truncated: 0, timeElements: 0, datetimeClass: {}, vocabulary: {}, nonStandardValues: 0, textShape: {} }; const names = new Set(); for (const row of rows) { const cell = row.children[index]; if (!cell) continue; facts.cells += 1; const cellText = N(cell.textContent); if (!cellText) facts.empty += 1; let labelled = false; for (const element of [cell, ...cell.querySelectorAll('*')]) { if (element !== cell) bump(facts.tags, element.tagName); element.getAttributeNames().forEach((name) => names.add(name)); for (const name of ['data-garden-id', 'data-test-id']) { const value = element.getAttribute(name); if (value === null) continue; if (/\d/.test(value)) facts.digitIdentifiers += 1; else if (plainIdentifier(value)) bump(facts.identifiers, value); else facts.otherIdentifiers += 1; } for (const [name, key] of [['title', 'title'], ['alt', 'alt'], ['aria-label', 'ariaLabel']]) { const value = element.getAttribute(name); if (value === null) continue; facts[key] += 1; if (N(value) === cellText) facts[key + 'EqualsText'] += 1; if (N(value)) labelled = true; } const shape = shapeOf(element); if (shape) facts[shape] += 1; if (element.tagName === 'TIME') { facts.timeElements += 1; const stamp = element.getAttribute('datetime'); bump(facts.datetimeClass, stamp === null ? 'absent' : /^\d{4}-\d{2}-\d{2}T/.test(stamp) ? 'iso-datetime' : /^\d{4}-\d{2}-\d{2}$/.test(stamp) ? 'iso-date' : 'other'); } } if (!cellText && labelled) facts.labelOnly += 1; if (VOCABULARY.includes(cellText)) bump(facts.vocabulary, cellText); else if (cellText) facts.nonStandardValues += 1; if (cellText) bump(facts.textShape, RELATIVE.test(cellText) ? 'relative' : ABSOLUTE.test(cellText) ? 'absolute' : 'other'); } facts.attributeNames = [...names].sort(); return facts; }); return { table: true, headerCount: headers.length, ticketRows: rows.length, groupRows: table.querySelectorAll('[data-garden-id="tables.group_row"]').length, duplicateLabelGroups: Object.values(labelCounts).filter((count) => count > 1).length, duplicateStandardLabels: Object.keys(labelCounts).filter((text) => labelCounts[text] > 1 && LABELS.includes(text)), columns }; })()`
- evidence: P1-cell-shapes on 2026-09-27 over the ungrouped personal recon view, Zendesk Light: 18 header cells, 30 ticket rows, 0 group rows. Columns 0 to 3 are the row selection checkbox (header Select all tickets) and three icon columns whose headers hold visually hidden text; column 17 is the row Actions overflow button. A supplementary allowlist-only probe classified the remaining values without returning tenant text: Type cells render Ticket in 24 of 30 (an unset type) and Problem in 6; both custom checkbox columns render No in 30 of 30; 10 of 30 status cells hold two-word custom status names; the custom dropdown has 24 non-empty one- or two-word values. A title probe found an absolute date with year and clock time in the title of every date TIME element (60 of 60). The view had no unassigned ticket on the captured page, so no Assignee placeholder could be observed.
- interpretation: Phase 9 matches Assignee, Requester, Group and Type on plain cell text; Requester, Group, Priority and the custom fields also repeat that text in the cell's own aria-label. The status column renders a badge whose aria-label equals its text and whose data-test-id encodes only the status category (status-badge-open, status-badge-pending, status-badge-hold), so a custom status name exists only as text. Dates render as TIME with an ISO datetime and an absolute title while the visible text mixes relative and absolute forms. A checkbox field renders the word No rather than an icon. An empty custom dropdown cell is truly empty text, and an unset Type renders the word Ticket.
- fallback: Phase 9 treats an unreadable or unrecorded cell shape as not matching; if the column picker does not offer Tags, Tags rules resolve no header, so RULE-07 keeps them inactive and RULE-F2 stays deferred (D-26).
- scenario: `light-rule-view`
- assignee-cell: plain text in a tables.cell with data-test-id ticket-table-cells-assignee; no aria-label, title or alt; 0 empty of 30; no unassigned row on the page
- requester-cell: plain text directly in the tables.cell; the cell aria-label equals the text in 30 of 30; 0 empty; no hidden or truncated text
- group-cell: plain text directly in the tables.cell; the cell aria-label equals the text in 30 of 30; 0 empty
- status-cell: header Ticket status; a SPAN badge inside two DIVs in a ticket-table-cells-custom-status cell; badge aria-label equals text in 30 of 30; badge data-test-id status-badge-open 26, status-badge-pending 3, status-badge-hold 1; standard values Open 19 and On-hold 1, plus 10 custom two-word names
- type-cell: plain text in a ticket-table-cells-type cell; Problem 6 and Ticket 24 (unset type); no aria-label
- subject-cell: an A link (buttons.anchor, ticket-table-cells-subject) inside two DIVs, its href removed at capture; ellipsis-truncated in 20 of 30; no aria-label or title
- date-cell: Updated: a TIME element (generic-table-cells-date) with an ISO date-time datetime and an absolute title in 30 of 30; the title never equals the visible text; visible text relative 16 and absolute 14; the Requested column renders the same way
- custom-field-cell: custom dropdown: plain text in the tables.cell with the cell aria-label equal to the text in 24 of 24 non-empty cells, 6 of 30 truly empty; the two custom checkbox fields render the word No with an equal aria-label in 30 of 30
- empty-placeholders: Ticket in Type for an unset type (24 of 30); truly empty text in the custom dropdown (6 of 30); no dash, None or Unassigned placeholder observed
- tags-column: `not-offered`
- tags-fallback: Tags rules resolve no header, so RULE-07 keeps them inactive, and RULE-F2 stays deferred (D-26).
- date-text-class: `mixed`
- date-machine-value: `both`
- vocabulary: `confirmed-from-session`
- vocabulary-notes: headerKinds Status renamed to Ticket status, the label this tenant's custom-status column renders; placeholders gained Ticket, the Type column's rendering of an unset type. Unchanged because the session showed the same spelling: Priority, Assignee, Requester, Group, Type, Subject, Updated, Open, On-hold, Problem. Not observed and left as they were: Tags, New, Pending, Solved, Closed, Question, Incident, Task. Custom status names and custom field titles stay tokenised.

## Recon 2 Entry: header-label-uniqueness

- id: `header-label-uniqueness`
- question: Do any two headers in the recon view share a label, does the tenant have two custom fields with the same title, and what exact text does each standard header render?
- scope: `English path`
- status: `verified`
- probe: `(() => { const table = document.querySelector('table[data-garden-id="tables.table"][data-test-id="generic-table"]'); if (!table) return { table: false }; const N = (value) => (value ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim(); const LABELS = ['Priority', 'Assignee', 'Requester', 'Group', 'Status', 'Type', 'Subject', 'Tags', 'Updated', 'Requester updated', 'Assignee updated', 'Last updated', 'Created', 'Requested', 'Due date', 'Organization', 'ID', 'Satisfaction', 'Channel', 'Brand', 'Ticket form', 'Solved', 'Latest update', 'Requester name', 'Assignee name', 'Group name']; const STATUS = ['New', 'Open', 'Pending', 'On-hold', 'On hold', 'Solved', 'Closed']; const TYPES = ['Question', 'Incident', 'Problem', 'Task']; const PRIORITY = ['Urgent', 'High', 'Normal', 'Low']; const HOLDERS = ['-', '--', '\u2013', '\u2014', 'Unassigned', 'None', '(none)', 'n/a', 'N/A', 'No group']; const VOCABULARY = [...PRIORITY, ...STATUS, ...TYPES, ...HOLDERS]; const RELATIVE = /\b(?:ago|just now|yesterday|today|tomorrow|minutes?|hours?|days?|weeks?|months?|years?)\b/i; const ABSOLUTE = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b|\d{1,2}:\d{2}|\b\d{4}\b|\d{1,2}\/\d{1,2}/; const plainIdentifier = (value) => /^[a-z][a-z._-]*$/.test(value); const bump = (map, key) => { map[key] = (map[key] ?? 0) + 1; }; const shapeOf = (element) => { const style = getComputedStyle(element); if (style.display === 'none') return 'displayNone'; if (style.clip === 'rect(0px, 0px, 0px, 0px)' || style.clipPath === 'inset(50%)' || (style.position === 'absolute' && parseFloat(style.width) <= 1 && parseFloat(style.height) <= 1)) return 'visuallyHidden'; if (style.textOverflow === 'ellipsis' && element.scrollWidth > element.clientWidth) return 'truncated'; return null; }; const headers = [...table.querySelectorAll('thead [data-garden-id="tables.header_cell"]')]; const headerTexts = headers.map((cell) => N(cell.textContent)); const labelCounts = {}; headerTexts.filter(Boolean).forEach((text) => bump(labelCounts, text)); const rows = [...table.querySelectorAll('tbody tr[data-garden-id="tables.row"][data-test-id="generic-table-row"]')]; const columns = headers.map((header, index) => { const text = headerTexts[index]; const facts = { index, label: !text ? 'empty' : LABELS.includes(text) ? text : 'non-standard', labelRepeats: text ? labelCounts[text] : 0, cells: 0, empty: 0, labelOnly: 0, tags: {}, attributeNames: [], identifiers: {}, digitIdentifiers: 0, otherIdentifiers: 0, title: 0, titleEqualsText: 0, alt: 0, altEqualsText: 0, ariaLabel: 0, ariaLabelEqualsText: 0, visuallyHidden: 0, displayNone: 0, truncated: 0, timeElements: 0, datetimeClass: {}, vocabulary: {}, nonStandardValues: 0, textShape: {} }; const names = new Set(); for (const row of rows) { const cell = row.children[index]; if (!cell) continue; facts.cells += 1; const cellText = N(cell.textContent); if (!cellText) facts.empty += 1; let labelled = false; for (const element of [cell, ...cell.querySelectorAll('*')]) { if (element !== cell) bump(facts.tags, element.tagName); element.getAttributeNames().forEach((name) => names.add(name)); for (const name of ['data-garden-id', 'data-test-id']) { const value = element.getAttribute(name); if (value === null) continue; if (/\d/.test(value)) facts.digitIdentifiers += 1; else if (plainIdentifier(value)) bump(facts.identifiers, value); else facts.otherIdentifiers += 1; } for (const [name, key] of [['title', 'title'], ['alt', 'alt'], ['aria-label', 'ariaLabel']]) { const value = element.getAttribute(name); if (value === null) continue; facts[key] += 1; if (N(value) === cellText) facts[key + 'EqualsText'] += 1; if (N(value)) labelled = true; } const shape = shapeOf(element); if (shape) facts[shape] += 1; if (element.tagName === 'TIME') { facts.timeElements += 1; const stamp = element.getAttribute('datetime'); bump(facts.datetimeClass, stamp === null ? 'absent' : /^\d{4}-\d{2}-\d{2}T/.test(stamp) ? 'iso-datetime' : /^\d{4}-\d{2}-\d{2}$/.test(stamp) ? 'iso-date' : 'other'); } } if (!cellText && labelled) facts.labelOnly += 1; if (VOCABULARY.includes(cellText)) bump(facts.vocabulary, cellText); else if (cellText) facts.nonStandardValues += 1; if (cellText) bump(facts.textShape, RELATIVE.test(cellText) ? 'relative' : ABSOLUTE.test(cellText) ? 'absolute' : 'other'); } facts.attributeNames = [...names].sort(); return facts; }); return { table: true, headerCount: headers.length, ticketRows: rows.length, groupRows: table.querySelectorAll('[data-garden-id="tables.group_row"]').length, duplicateLabelGroups: Object.values(labelCounts).filter((count) => count > 1).length, duplicateStandardLabels: Object.keys(labelCounts).filter((text) => labelCounts[text] > 1 && LABELS.includes(text)), columns }; })()`
- evidence: P1 returned duplicateLabelGroups 1 and an empty duplicateStandardLabels: columns 15 and 16 share one non-standard label. They are the tenant's two active custom checkbox fields that have the same title, both added to the personal recon view; the view's column picker listed both under that one title. This used existing fields and a personal view only, with no admin change (D-25). The supplementary header probe read the status column header as Ticket status.
- interpretation: EDIT-06 must tell duplicate labels apart by column position: a real tenant has two custom fields with one title and both can appear in the same view. The standard labels render exactly as listed, the status column reads Ticket status where custom statuses are on, and the created date reads Requested.
- fallback: Phase 10 (EDIT-06) tells any duplicate label apart by column position and uses the exact standard labels recorded here; no admin change is made to create a duplicate (D-25).
- scenario: `light-rule-view`
- duplicate-in-view: `yes`
- duplicate-custom-titles: `yes`
- standard-header-labels: Ticket status, Subject, Requester, Requested, Assignee, ID, Priority, Group, Type, Updated

## Recon 2 Verdict

- recon2-verdict: `proceed`
- blocked-consumers: `none`
- fixture-light-table: `admitted`
- fixture-identity-region: `admitted`
- fixture-dark-table: `admitted`
- rationale: Proceed because Appearance is offered and the v1 Garden identifiers and Document root hold in dark mode (D-24). Phase 8 receives the html[data-theme] document marker, the in-place attribute swap on in-app switches, the stale-until-reload Match system behaviour, the measured light and dark surfaces and the dark native hover, selection, sticky and focus paints, plus the dark-table fixture. Phase 9 receives the rule-column cell shapes, the Ticket placeholder for an unset type, the Ticket status header, the mixed relative and absolute date text with ISO datetime and absolute title, and the light-table fixture. Phase 10 receives the top-bar avatar alt identity at load, its identical match to the Assignee text, the duplicate custom-title case for EDIT-06, and the identity-region fixture. Fallbacks in force: Tags is not offered as a column, so Tags rules resolve no header, RULE-07 keeps them inactive and RULE-F2 stays deferred (D-26); no unassigned Assignee placeholder was observed, so Phase 9 treats that unrecorded shape as not matching.

## Spec-less Planning Assumptions

These planner-generated probes are not live DOM conclusions and do not waive a
requirement. Six resolved gating rows cite repository test evidence. The unresolved
RECON-01/unclassified probe is explicitly non-gating under the approved Plan 01-15
contract and must remain named in the Final Verdict until a specification resolves it.

| Requirement | Category | Status | Gating | Evidence | Probe |
|-------------|----------|--------|--------|----------|-------|
| RECON-01 | unclassified | unresolved | non-gating | No Phase 1 SPEC.md exists from which to derive an edge contract; surfaced explicitly in the verdict. | Review manually; no spec-derived edge contract is available. |
| RECON-02 | adjacency | resolved | gating | test/recon/fixture-contract.test.js#fixture-canonical-duplicate; test/recon/sensitive-patterns.smoke.js#NFD content against NFC denylist | When two things are exactly equal or just touch, do they merge, collide, or separate? |
| RECON-02 | empty | resolved | gating | test/recon/fixture-contract.test.js#manifest-object-required | What is the result for empty, single-element, or null input? |
| RECON-02 | ordering | resolved | gating | test/recon/sensitive-patterns.smoke.js#deduplicates overlapping matches and returns findings in stable order; test/recon/recon-gate.smoke.js#blocker ordering does not depend on ledger section order | When elements compare equal, is output order specified and stable? |
| RECON-03 | adjacency | resolved | gating | test/recon/fixture-contract.test.js#binds the absence selector to the declared table and header topology; test/recon/sanitized-output-contract.test.js#two tables | When two things are exactly equal or just touch, do they merge, collide, or separate? |
| RECON-03 | empty | resolved | gating | test/recon/recon-gate.smoke.js#empty ledgers and blank required fields reject with stable codes | What is the result for empty, single-element, or null input? |
| RECON-03 | ordering | resolved | gating | test/recon/recon-gate.smoke.js#blocker ordering does not depend on ledger section order | When elements compare equal, is output order specified and stable? |

## Final Verdict

- flagged-assumptions: `RECON-01/unclassified`

- closed-shadow-dom-state: `ruled-out`
- garden-identifier-state: `present`
- corpus-gates-state: `passed`
- interaction-gate-state: `passed`
- fallback-rung-1: `garden-pair | proven | test/recon/fixture-contract.test.js`
- fallback-rung-2: `test-id-pair | unproven | none`
- fallback-rung-3: `structural | unproven | none`
- selector-authorization: `garden-pair`

- verdict: `proceed`
- closed-shadow-dom: No. Every sampled ticket row was directly contained by the current top document and its complete root chain ended at `Document` without any open or closed `ShadowRoot`.
- garden-identifier: Present. The winning selector is `table[data-garden-id="tables.table"][data-test-id="generic-table"]`, with ticket rows selected positively as `[data-garden-id="tables.row"][data-test-id="generic-table-row"]` and group rows excluded by construction.
- ranked-fallback: If Garden identifiers disappear, the paired `data-test-id` selectors are the first fallback but must pass the complete three-scenario corpus again; the final structural fallback is not yet proven and therefore cannot independently authorize implementation. Priority values have no locale-independent machine-readable signal, so the only accepted Priority fallback is exact English `Priority`, `Urgent`, `High`, `Normal`, and `Low` text in an `html[lang="en"]` document, with blank or unknown values returned unreadable.
- painting-element: The normal white surface is painted by `DIV[data-garden-id="pane"]`; ticket rows and their direct cells are transparent. Any future tint must be confined to direct cells of positively matched ticket rows and must leave the sticky header cells untouched.
- corpus-gates: Passed for all three admitted live-derived scenarios. Sensitive scanning preceded detached parsing, exact final-byte SHA-256 values matched, declared selectors resolved, and Priority-present, Priority-absent, group-row, same-table-sticky-header, and scroll-container invariants passed.
- interaction-gate: Passed. The user-controlled grouped-long comparison produced one selected row, one distinct hovered row, and a separate normal row; their sanitized paint summaries are distinct, and the ticket row is the observed native paint owner.
- prohibition-dispositions: `passed`
- scope: This verdict applies only to the English current Agent Workspace shell observed on 2026-09-03 with account plan unknown/not shared. It makes no localization, legacy-shell, vanity-domain, or cross-plan compatibility claim; localization remains outside Phase 1.
- rationale: The repository gate authorizes proceed because the complete English-path ledger, positive interaction evidence, direct-Document root-chain proof, current Garden identifiers, admitted three-scenario corpus, and all five test-or-judgment prohibition dispositions pass. Independent phase verification and historical dependency approval independence remain separate acceptance questions. RECON-01/unclassified remains an explicitly flagged, non-gating specification gap. This authorization remains limited to the observed English current Agent Workspace scope and must fail quiet if its selectors, language signal, or structural predicates no longer hold.
