import { useState, useEffect, useRef } from "react";
import { GlassIcon, PlusIcon, SearchIcon, PinIcon, TrashIcon, EditIcon, CloseIcon } from "./Icons";
import { showConfirm, toast } from "./Dialog";
import { listConversations, createConversation, renameConversation, pinConversation, deleteConversation, getMemories, addMemory, deleteMemory } from "../services/api";
import styles from "../styles/Sidebar.module.css";

function timeAgo(dateStr, lang) {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (lang === "hi") {
    if (m < 1)  return "अभी";
    if (m < 60) return `${m}m पहले`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h पहले`;
    return `${Math.floor(h / 24)}d पहले`;
  }
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Sidebar({ activeId, onSelect, onNew, isOpen, onClose, t, lang, user, onLogout }) {
  const [conversations, setConversations] = useState([]);
  const [memories,      setMemories]      = useState([]);
  const [tab,           setTab]           = useState("chats");
  const [search,        setSearch]        = useState("");
  const [editingId,     setEditingId]     = useState(null);
  const [editTitle,     setEditTitle]     = useState("");
  const [newMemory,     setNewMemory]     = useState("");
  const editRef = useRef(null);

  const loadChats = async (q) => {
    try { const d = await listConversations(q); setConversations(d.conversations); } catch (_) {}
  };
  const loadMemories = async () => {
    try { const d = await getMemories(); setMemories(d.memories); } catch (_) {}
  };

  useEffect(() => { loadChats(); loadMemories(); }, [activeId]);
  useEffect(() => {
    const timer = setTimeout(() => loadChats(search || undefined), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleNew = async () => {
    const d = await createConversation();
    onNew(d.conversation.id);
    loadChats();
  };

  const handlePin = async (e, id) => {
    e.stopPropagation();
    await pinConversation(id);
    loadChats();
  };

  // ── Custom confirm dialog — no more browser alert! ─────────────
  const handleDelete = async (e, id, title) => {
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: "Delete conversation?",
      message: `"${title?.slice(0, 40) || 'This conversation'}" will be permanently deleted.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      danger: true,
    });
    if (!confirmed) return;
    await deleteConversation(id);
    if (id === activeId) onNew(null);
    loadChats();
    toast.success("Conversation deleted");
  };

  const startEdit = (e, conv) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setTimeout(() => editRef.current?.focus(), 50);
  };

  const saveEdit = async (id) => {
    if (editTitle.trim()) { await renameConversation(id, editTitle.trim()); toast.success("Renamed!"); }
    setEditingId(null);
    loadChats();
  };

  const handleAddMemory = async () => {
    if (!newMemory.trim()) return;
    await addMemory(newMemory.trim());
    setNewMemory("");
    loadMemories();
    toast.success("Memory saved! 🧠");
  };

  const handleDeleteMemory = async (id) => {
    const confirmed = await showConfirm({ title: "Remove memory?", message: "This fact will be forgotten.", confirmText: "Remove", danger: true });
    if (!confirmed) return;
    await deleteMemory(id);
    loadMemories();
  };

  const pinned   = conversations.filter(c => c.pinned);
  const unpinned = conversations.filter(c => !c.pinned);

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>

        {/* Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>🌸</span>
            <span className={styles.brandName}>{t("sidebar.title")}</span>
          </div>
          <GlassIcon onClick={handleNew} title={t("header.newChat")} size={30} color="purple">
            <PlusIcon />
          </GlassIcon>
        </div>

        {/* User pill */}
        {user && (
          <div className={styles.userPill}>
            <div className={styles.userAvatar}>{user.name?.[0]?.toUpperCase() || "S"}</div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user.name}</p>
              <p className={styles.userEmail}>{user.email}</p>
            </div>
            <button className={styles.logoutBtn} onClick={onLogout} title="Sign out">⎋</button>
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === "chats"  ? styles.tabActive : ""}`} onClick={() => setTab("chats")}>
            💬 {t("sidebar.chats")}
          </button>
          <button className={`${styles.tab} ${tab === "memory" ? styles.tabActive : ""}`} onClick={() => setTab("memory")}>
            🧠 {t("sidebar.memory")}
          </button>
        </div>

        {/* ── Chats ── */}
        {tab === "chats" && (
          <>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}><SearchIcon /></span>
              <input className={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder={t("sidebar.searchPlaceholder")} />
              {search && <button className={styles.clearSearch} onClick={() => setSearch("")}><CloseIcon /></button>}
            </div>

            <div className={styles.convList}>
              {pinned.length > 0 && (
                <><p className={styles.groupLabel}>📌 {t("sidebar.pinned")}</p>
                  {pinned.map(c => <ConvItem key={c.id} conv={c} activeId={activeId} onSelect={onSelect} onPin={handlePin} onDelete={handleDelete} onEdit={startEdit} editingId={editingId} editTitle={editTitle} setEditTitle={setEditTitle} saveEdit={saveEdit} editRef={editRef} lang={lang} />)}
                </>
              )}
              {unpinned.length > 0 && (
                <><p className={styles.groupLabel}>🕒 {t("sidebar.recent")}</p>
                  {unpinned.map(c => <ConvItem key={c.id} conv={c} activeId={activeId} onSelect={onSelect} onPin={handlePin} onDelete={handleDelete} onEdit={startEdit} editingId={editingId} editTitle={editTitle} setEditTitle={setEditTitle} saveEdit={saveEdit} editRef={editRef} lang={lang} />)}
                </>
              )}
              {conversations.length === 0 && (
                <div className={styles.empty}>
                  <p className={styles.emptyTitle}>{t("sidebar.noChats")}</p>
                  <p className={styles.emptyHint}>{t("sidebar.noChatsHint")}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Memory ── */}
        {tab === "memory" && (
          <div className={styles.memTab}>
            <p className={styles.memHint}>{t("sidebar.memoryHint")}</p>
            <div className={styles.memInput}>
              <input value={newMemory} onChange={e => setNewMemory(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddMemory()} placeholder={t("sidebar.memoryPlaceholder")} className={styles.memTextInput} />
              <button className={styles.memAddBtn} onClick={handleAddMemory}>{t("sidebar.memoryAdd")}</button>
            </div>
            <div className={styles.memList}>
              {memories.map(m => (
                <div key={m.id} className={styles.memItem}>
                  <span className={styles.memDot}>●</span>
                  <span className={styles.memText}>{m.text}</span>
                  <button className={styles.memDel} onClick={() => handleDeleteMemory(m.id)}><CloseIcon /></button>
                </div>
              ))}
              {memories.length === 0 && <p className={styles.emptyHint}>{t("sidebar.noMemory")}</p>}
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <span className={styles.footerText}>{t("sidebar.footer")}</span>
        </div>
      </aside>
    </>
  );
}

function ConvItem({ conv, activeId, onSelect, onPin, onDelete, onEdit, editingId, editTitle, setEditTitle, saveEdit, editRef, lang }) {
  const isActive = conv.id === activeId;
  return (
    <div className={`${styles.convItem} ${isActive ? styles.convItemActive : ""}`} onClick={() => onSelect(conv.id)}>
      {editingId === conv.id ? (
        <input ref={editRef} className={styles.editInput} value={editTitle} onChange={e => setEditTitle(e.target.value)} onBlur={() => saveEdit(conv.id)} onKeyDown={e => { if (e.key === "Enter") saveEdit(conv.id); e.stopPropagation(); }} onClick={e => e.stopPropagation()} />
      ) : (
        <>
          <div className={styles.convInfo}>
            <p className={styles.convTitle}>{conv.pinned ? "📌 " : ""}{conv.title}</p>
            {conv.preview && <p className={styles.convPreview}>{conv.preview}</p>}
            <p className={styles.convTime}>{timeAgo(conv.updatedAt, lang)}</p>
          </div>
          <div className={styles.convActions}>
            <button className={`${styles.iconBtn} ${conv.pinned ? styles.pinned : ""}`} onClick={e => onPin(e, conv.id)} title="Pin"><PinIcon filled={conv.pinned} /></button>
            <button className={styles.iconBtn} onClick={e => onEdit(e, conv)} title="Rename"><EditIcon /></button>
            <button className={`${styles.iconBtn} ${styles.danger}`} onClick={e => onDelete(e, conv.id, conv.title)} title="Delete"><TrashIcon /></button>
          </div>
        </>
      )}
    </div>
  );
}