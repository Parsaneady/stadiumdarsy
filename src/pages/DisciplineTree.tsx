import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, ChevronDown, ChevronLeft, Sparkles, TreePine } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type TreeNode = {
  id: string;
  title: string;
  done?: boolean;
  collapsed?: boolean;
  children: TreeNode[];
};

const STORAGE_KEY = (uid: string) => `discipline-tree-v1-${uid}`;

const defaultTree = (): TreeNode => ({
  id: 'root',
  title: 'برنامه این هفته',
  children: [
    {
      id: crypto.randomUUID(),
      title: 'درس زیست',
      children: [
        {
          id: crypto.randomUUID(),
          title: 'فصل ۵',
          children: [
            { id: crypto.randomUUID(), title: 'مطالعه', children: [] },
            { id: crypto.randomUUID(), title: 'تست', children: [] },
          ],
        },
      ],
    },
  ],
});

const updateNode = (node: TreeNode, id: string, fn: (n: TreeNode) => TreeNode): TreeNode => {
  if (node.id === id) return fn(node);
  return { ...node, children: node.children.map((c) => updateNode(c, id, fn)) };
};

const removeNode = (node: TreeNode, id: string): TreeNode => ({
  ...node,
  children: node.children.filter((c) => c.id !== id).map((c) => removeNode(c, id)),
});

const countStats = (node: TreeNode): { total: number; done: number } => {
  let total = 0, done = 0;
  const walk = (n: TreeNode) => {
    if (n.children.length === 0 && n.id !== 'root') {
      total++;
      if (n.done) done++;
    }
    n.children.forEach(walk);
  };
  walk(node);
  return { total, done };
};

// Soft pastel palette per depth
const depthColors = [
  'from-cyan-300/30 to-sky-400/20 border-cyan-200/40',
  'from-violet-300/30 to-fuchsia-400/20 border-violet-200/40',
  'from-emerald-300/30 to-teal-400/20 border-emerald-200/40',
  'from-amber-300/30 to-orange-400/20 border-amber-200/40',
  'from-rose-300/30 to-pink-400/20 border-rose-200/40',
];

const NodeBubble = ({
  node,
  depth,
  onAdd,
  onRemove,
  onToggleDone,
  onToggleCollapse,
  onRename,
}: {
  node: TreeNode;
  depth: number;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleDone: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onRename: (id: string, title: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(node.title);
  const isRoot = node.id === 'root';
  const hasChildren = node.children.length > 0;
  const palette = depthColors[depth % depthColors.length];

  // Floating animation seed per node
  const float = useMemo(() => ({
    duration: 4 + (node.id.charCodeAt(0) % 5) * 0.5,
    y: 6 + (node.id.charCodeAt(1) % 4),
    delay: (node.id.charCodeAt(2) % 10) * 0.1,
  }), [node.id]);

  return (
    <div className="flex flex-col items-start">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: [0, -float.y, 0],
        }}
        transition={{
          opacity: { duration: 0.4 },
          scale: { duration: 0.4 },
          y: { duration: float.duration, repeat: Infinity, ease: 'easeInOut', delay: float.delay },
        }}
        className={cn(
          'group relative rounded-2xl border backdrop-blur-xl px-4 py-2.5 shadow-lg',
          'bg-gradient-to-br',
          palette,
          node.done && 'opacity-60'
        )}
      >
        <div className="flex items-center gap-2">
          {!isRoot && (
            <button
              onClick={() => onToggleDone(node.id)}
              className={cn(
                'w-5 h-5 rounded-md border-2 border-white/40 flex items-center justify-center transition-all',
                node.done ? 'bg-emerald-400/80 border-emerald-300' : 'hover:bg-white/10'
              )}
            >
              {node.done && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
          )}
          {isRoot && <Sparkles className="w-4 h-4 text-cyan-100" />}

          {editing ? (
            <Input
              autoFocus
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onBlur={() => { onRename(node.id, val.trim() || node.title); setEditing(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              className="h-7 w-40 text-sm bg-background/40"
            />
          ) : (
            <span
              onDoubleClick={() => !isRoot && setEditing(true)}
              className={cn(
                'text-sm font-semibold text-foreground select-none whitespace-nowrap',
                node.done && 'line-through'
              )}
            >
              {node.title}
            </span>
          )}

          {hasChildren && (
            <button onClick={() => onToggleCollapse(node.id)} className="text-foreground/60 hover:text-foreground">
              {node.collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAdd(node.id)}
              className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center"
              title="افزودن شاخه"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            {!isRoot && (
              <button
                onClick={() => onRemove(node.id)}
                className="w-6 h-6 rounded-full bg-rose-500/20 hover:bg-rose-500/40 flex items-center justify-center"
                title="حذف"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {hasChildren && !node.collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative mr-6 mt-3 pr-6 border-r border-dashed border-white/20"
          >
            <div className="flex flex-col gap-4">
              {node.children.map((child) => (
                <div key={child.id} className="relative">
                  <span className="absolute right-[-1.5rem] top-5 w-6 border-t border-dashed border-white/20" />
                  <NodeBubble
                    node={child}
                    depth={depth + 1}
                    onAdd={onAdd}
                    onRemove={onRemove}
                    onToggleDone={onToggleDone}
                    onToggleCollapse={onToggleCollapse}
                    onRename={onRename}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function DisciplineTree() {
  const { user } = useAuth();
  const uid = user?.id || 'guest';
  const [tree, setTree] = useState<TreeNode>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(uid));
      if (raw) return JSON.parse(raw);
    } catch {}
    return defaultTree();
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(uid));
      if (raw) setTree(JSON.parse(raw));
    } catch {}
  }, [uid]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY(uid), JSON.stringify(tree)); } catch {}
  }, [tree, uid]);

  const stats = countStats(tree);
  const progress = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  const addChild = (id: string) =>
    setTree((t) => updateNode(t, id, (n) => ({
      ...n,
      collapsed: false,
      children: [...n.children, { id: crypto.randomUUID(), title: 'موضوع جدید', children: [] }],
    })));

  const remove = (id: string) => setTree((t) => removeNode(t, id));
  const toggleDone = (id: string) =>
    setTree((t) => updateNode(t, id, (n) => ({ ...n, done: !n.done })));
  const toggleCollapse = (id: string) =>
    setTree((t) => updateNode(t, id, (n) => ({ ...n, collapsed: !n.collapsed })));
  const rename = (id: string, title: string) =>
    setTree((t) => updateNode(t, id, (n) => ({ ...n, title })));

  const reset = () => {
    if (confirm('درخت دیسیپلین به حالت پیش‌فرض بازنشانی شود؟')) setTree(defaultTree());
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <Sidebar />

      {/* Cosmic backdrop */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-background to-cyan-950/30" />
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-500/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-1/4 w-[400px] h-[400px] rounded-full bg-cyan-400/10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        {/* Stars */}
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/60"
            style={{
              top: `${(i * 37) % 100}%`,
              left: `${(i * 53) % 100}%`,
            }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: (i % 5) * 0.3 }}
          />
        ))}
      </div>

      <main className="mr-72 p-8 relative z-10">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg">
                <TreePine className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">درخت دیسیپلین</h1>
                <p className="text-sm text-muted-foreground">فضای ذهنی برای آرامش و نظم — موضوعاتت رو در خلا ببین</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <GlassCard hover={false} className="!p-3 flex items-center gap-3">
                <div className="text-xs text-muted-foreground">پیشرفت</div>
                <div className="text-lg font-bold">{stats.done}/{stats.total}</div>
                <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                    animate={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs font-semibold">{progress}%</div>
              </GlassCard>
              <Button variant="outline" size="sm" onClick={reset}>بازنشانی</Button>
            </div>
          </div>

          <GlassCard className="!p-8 min-h-[60vh] overflow-auto">
            <div className="flex justify-start">
              <NodeBubble
                node={tree}
                depth={0}
                onAdd={addChild}
                onRemove={remove}
                onToggleDone={toggleDone}
                onToggleCollapse={toggleCollapse}
                onRename={rename}
              />
            </div>
            <div className="mt-6 text-center text-xs text-muted-foreground">
              برای ویرایش نام، روی هر موضوع دوبار کلیک کن — برای افزودن شاخه از دکمه + استفاده کن
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
