/**
 * Portfolio prototype entry — single-scroll demo intended to be ported
 * to a Next.js route at connorburns.dev/projects/playbook. See
 * PortfolioPreparation.md for the full scope.
 *
 * Task 1 (this file): skeleton wiring only — confirms the multi-page
 * Vite setup serves /portfolio/ alongside / without disturbing the
 * existing showcase. Task 2 layers in the actual hero content + code
 * snippet sections.
 */

import { Playbook, PlayDisplayer, createConnectedLayout } from '../../src/index.js';
import '../../src/styles.css';
import '../styles.css';

// Hero — connected layout with a couple of seeded plays so the visitor
// can immediately flip the book, pick moves, play the animation, and
// save a new page. Mirrors the V1->V2 connected demo from `demo/main.ts`
// section 7, trimmed down to a single instance.
const layout = createConnectedLayout('hero-connected');
const field = new PlayDisplayer('large', 'Portfolio', layout.fieldSlot);
const book = new Playbook({
  title: 'Portfolio',
  field,
  allowSave: true,
  pageOrientation: 'vertical',
  parentId: layout.bookSlot,
});
field.spawnSandbox(true, layout.sandboxSlot, book.createSaveButton());

book.addPage(
  'https://i.ibb.co/kSFmpZV/Hail-Mary-Out.png',
  'Hail Mary Out',
  'https://youtu.be/qyqCTMirNWg?t=289',
  ['straight-deep', 'mid-90-left', 'none', 'none', 'none', 'mid-90-right', 'straight-deep', 'pass-qb', 'none', 'hole-four-fb', 'none'],
);
book.addPage(
  'https://i.ibb.co/vsRPBKF/Left-Handoff-FB.png',
  'Left Handoff FB',
  null,
  ['none', 'none', 'none', 'none', 'none', 'none', 'none', 'hand-off-left-qb', 'hole-one-lhb', 'hole-two-fb', 'hole-five-rhb'],
);
