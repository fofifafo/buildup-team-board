import React, { useState, useEffect, useMemo } from "react";
import { Plus, Search, Bell, Shield, ArrowLeft, Trash2, Users, Calendar, X, Check, Circle, Lock } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const BOARD_DOC = doc(db, "boardData", "main");

const ROLES = [
  { id: "기획", color: "#8b5cf6", bg: "#231a3d", text: "#c4b5fd" },
  { id: "개발", color: "#22d3ee", bg: "#122b31", text: "#67e8f9" },
  { id: "아트", color: "#f472b6", bg: "#331723", text: "#f9a8d4" },
  { id: "사운드", color: "#fbbf24", bg: "#2e2409", text: "#fcd34d" },
  { id: "기타", color: "#94a3b8", bg: "#20242c", text: "#cbd5e1" },
];

const ADMIN_PASSWORD = "admin1234";

function roleMeta(id) {
  return ROLES.find((r) => r.id === id) || ROLES[4];
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function dday(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / 86400000);
  return diff;
}

function seedPosts() {
  return [
    {
      id: uid(),
      title: "환영합니다 — 게시판 이용 안내",
      author: "운영자",
      pin: "0000",
      roles: ["기획"],
      content:
        "이 게시판은 기획자가 프로젝트 기획서를 올리고, 개발/아트/사운드 팀원을 모집하는 팀빌딩 공간입니다.\n\n[이용 방법]\n1. 기획자는 '기획서 올리기'에서 프로젝트를 등록합니다. 등록 시 입력한 이름과 PIN은 나중에 지원자 알림 확인, 수정, 삭제에 필요하니 꼭 기억해두세요.\n2. 개발/아트 등 참여를 원하는 분은 게시글을 열람하고 '지원하기'로 지원서를 작성합니다.\n3. 지원이 완료되면 작성자에게 알림이 쌓이고, 작성자는 '내 알림'에서 이름과 PIN으로 확인할 수 있습니다.\n\n이 게시글은 예시이며 관리자가 언제든 삭제할 수 있습니다.",
      deadline: "",
      status: "open",
      createdAt: Date.now() - 1000 * 60 * 60 * 24,
      applications: [],
    },
  ];
}

async function loadPosts() {
  try {
    const snap = await getDoc(BOARD_DOC);
    if (snap.exists() && Array.isArray(snap.data().posts)) return snap.data().posts;
    return null;
  } catch (e) {
    console.error("불러오기 실패", e);
    return null;
  }
}

async function savePosts(posts) {
  try {
    await setDoc(BOARD_DOC, { posts });
  } catch (e) {
    console.error("저장 실패", e);
  }
}

function StatusBadge({ status }) {
  const open = status !== "closed";
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.05em",
        padding: "3px 8px",
        borderRadius: 4,
        background: open ? "#0d2b1f" : "#2c2020",
        color: open ? "#6ee7b7" : "#fca5a5",
        border: `1px solid ${open ? "#134e35" : "#3f2626"}`,
      }}
    >
      {open ? "모집중" : "마감"}
    </span>
  );
}

function RoleChip({ id, small }) {
  const m = roleMeta(id);
  return (
    <span
      style={{
        fontSize: small ? 11 : 12,
        fontWeight: 600,
        padding: small ? "2px 7px" : "3px 9px",
        borderRadius: 4,
        background: m.bg,
        color: m.text,
        border: `1px solid ${m.color}33`,
        whiteSpace: "nowrap",
      }}
    >
      {id}
    </span>
  );
}

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "#c7cad4",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 12, color: "#767c8d", marginTop: 6 }}>{hint}</p>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: "#181a24",
  border: "1px solid #2e3242",
  borderRadius: 6,
  padding: "10px 12px",
  color: "#e8e9ee",
  fontSize: 14,
  fontFamily: "var(--font-body)",
  outline: "none",
};

function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
function TextArea(props) {
  return (
    <textarea
      {...props}
      style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, ...(props.style || {}) }}
    />
  );
}
function Select(props) {
  return (
    <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>
      {props.children}
    </select>
  );
}

function PrimaryButton({ children, onClick, style, type = "button", disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: disabled ? "#2a2d3a" : "#7c6cf0",
        color: disabled ? "#6b6f80" : "#0d0e14",
        border: "none",
        borderRadius: 6,
        padding: "10px 18px",
        fontSize: 14,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-display)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "transparent",
        color: "#c7cad4",
        border: "1px solid #2e3242",
        borderRadius: 6,
        padding: "9px 16px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Header({ view, setView }) {
  const navItem = (key, label, Icon) => (
    <button
      onClick={() => setView(key)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "transparent",
        border: "none",
        color: view === key ? "#e8e9ee" : "#8a8fa3",
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
        padding: "6px 4px",
        borderBottom: view === key ? "2px solid #7c6cf0" : "2px solid transparent",
      }}
    >
      <Icon size={15} />
      {label}
    </button>
  );
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "#0d0e14ee",
        backdropFilter: "blur(6px)",
        borderBottom: "1px solid #232635",
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          onClick={() => setView("list")}
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: 17,
            color: "#e8e9ee",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: "#7c6cf0" }}>&lt;</span>
          BUILD:UP
          <span style={{ color: "#7c6cf0" }}>/&gt;</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {navItem("list", "홈", Search)}
          {navItem("write", "기획서 올리기", Plus)}
          {navItem("notify", "내 알림", Bell)}
          {navItem("admin", "관리자", Shield)}
        </div>
      </div>
    </div>
  );
}

function ListView({ posts, setView, setSelectedId }) {
  const [roleFilter, setRoleFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return posts
      .filter((p) => (roleFilter ? p.roles.includes(roleFilter) : true))
      .filter((p) => (statusFilter === "all" ? true : p.status === statusFilter))
      .filter((p) =>
        q.trim() ? (p.title + p.author).toLowerCase().includes(q.trim().toLowerCase()) : true
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, roleFilter, statusFilter, q]);

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 20px 80px" }}>
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "#7c6cf0",
            letterSpacing: "0.08em",
            marginBottom: 8,
          }}
        >
          PARTY RECRUITMENT BOARD
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 32,
            fontWeight: 700,
            color: "#e8e9ee",
            margin: "0 0 8px",
          }}
        >
          지금 모집 중인 프로젝트
        </h1>
        <p style={{ color: "#8a8fa3", fontSize: 15, margin: 0 }}>
          게임 기획서를 올리고, 함께 만들 개발자와 아티스트를 찾아보세요.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <button
          onClick={() => setRoleFilter(null)}
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: "6px 12px",
            borderRadius: 20,
            border: `1px solid ${roleFilter === null ? "#7c6cf0" : "#2e3242"}`,
            background: roleFilter === null ? "#7c6cf022" : "transparent",
            color: roleFilter === null ? "#c4b5fd" : "#8a8fa3",
            cursor: "pointer",
          }}
        >
          전체
        </button>
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRoleFilter(roleFilter === r.id ? null : r.id)}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "6px 12px",
              borderRadius: 20,
              border: `1px solid ${roleFilter === r.id ? r.color : "#2e3242"}`,
              background: roleFilter === r.id ? r.color + "22" : "transparent",
              color: roleFilter === r.id ? r.text : "#8a8fa3",
              cursor: "pointer",
            }}
          >
            {r.id}
          </button>
        ))}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ ...inputStyle, width: "auto", padding: "6px 10px", fontSize: 12 }}
        >
          <option value="all">전체 상태</option>
          <option value="open">모집중</option>
          <option value="closed">마감</option>
        </select>
        <div style={{ position: "relative", marginLeft: "auto", minWidth: 220 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "#767c8d" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="제목, 작성자 검색"
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            border: "1px dashed #2e3242",
            borderRadius: 10,
            padding: "60px 20px",
            textAlign: "center",
            color: "#767c8d",
          }}
        >
          조건에 맞는 프로젝트가 없습니다.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((p) => {
            const dd = dday(p.deadline);
            return (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedId(p.id);
                  setView("detail");
                }}
                style={{
                  background: "#161822",
                  border: "1px solid #232635",
                  borderRadius: 10,
                  padding: 18,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "border-color .15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3a3f52")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#232635")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {p.roles.map((r) => (
                      <RoleChip key={r} id={r} small />
                    ))}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#e8e9ee",
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{
                    color: "#8a8fa3",
                    fontSize: 13,
                    margin: 0,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: 1.5,
                    minHeight: 39,
                  }}
                >
                  {p.content}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "#767c8d",
                    marginTop: 4,
                    borderTop: "1px solid #232635",
                    paddingTop: 10,
                  }}
                >
                  <span>{p.author}</span>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Users size={12} /> {p.applications.length}
                    </span>
                    {p.deadline ? (
                      <span style={{ color: dd !== null && dd < 0 ? "#767c8d" : "#f5a524" }}>
                        {dd === null ? "" : dd < 0 ? "마감됨" : dd === 0 ? "D-DAY" : `D-${dd}`}
                      </span>
                    ) : (
                      <span>상시</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WriteView({ addPost, setView }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pin, setPin] = useState("");
  const [roles, setRoles] = useState([]);
  const [deadline, setDeadline] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  function toggleRole(id) {
    setRoles((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  function submit() {
    if (!title.trim() || !author.trim() || !content.trim()) {
      setError("제목, 작성자, 내용을 모두 입력해 주세요.");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError("관리 PIN은 숫자 4자리로 입력해 주세요.");
      return;
    }
    if (roles.length === 0) {
      setError("모집 분야를 하나 이상 선택해 주세요.");
      return;
    }
    setError("");
    addPost({
      id: uid(),
      title: title.trim(),
      author: author.trim(),
      pin,
      roles,
      content: content.trim(),
      deadline,
      status: "open",
      createdAt: Date.now(),
      applications: [],
    });
    setView("list");
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "36px 20px 80px" }}>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 24,
          fontWeight: 700,
          color: "#e8e9ee",
          marginBottom: 24,
        }}
      >
        기획서 올리기
      </h1>

      <Field label="제목">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="프로젝트 제목을 입력하세요" />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="작성자 이름">
          <TextInput value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="이름 또는 팀명" />
        </Field>
        <Field label="관리 PIN (숫자 4자리)" hint="지원자 알림 확인, 수정, 삭제 시 필요합니다. 꼭 기억해두세요.">
          <TextInput
            value={pin}
            maxLength={4}
            inputMode="numeric"
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="예: 1234"
          />
        </Field>
      </div>

      <Field label="모집 분야 (복수 선택 가능)">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => toggleRole(r.id)}
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 14px",
                borderRadius: 6,
                border: `1px solid ${roles.includes(r.id) ? r.color : "#2e3242"}`,
                background: roles.includes(r.id) ? r.color + "22" : "transparent",
                color: roles.includes(r.id) ? r.text : "#8a8fa3",
                cursor: "pointer",
              }}
            >
              {r.id}
            </button>
          ))}
        </div>
      </Field>

      <Field label="마감일 (선택)">
        <TextInput type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </Field>

      <Field label="기획 내용">
        <TextArea
          rows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={"장르와 컨셉, 핵심 재미 요소, 필요한 인원과 역할, 진행 방식 등을 자유롭게 작성하세요."}
        />
      </Field>

      {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: "flex", gap: 10 }}>
        <PrimaryButton onClick={submit}>등록하기</PrimaryButton>
        <GhostButton onClick={() => setView("list")}>취소</GhostButton>
      </div>
    </div>
  );
}

function ApplyForm({ post, onApply, onDone }) {
  const [form, setForm] = useState({
    dept: "",
    studentId: "",
    grade: "1",
    name: "",
    role: post.roles[0],
    intro: "",
  });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit() {
    if (!form.dept.trim() || !form.studentId.trim() || !form.name.trim() || !form.intro.trim()) {
      setError("모든 항목을 입력해 주세요.");
      return;
    }
    setError("");
    onApply({
      id: uid(),
      ...form,
      appliedAt: Date.now(),
      read: false,
    });
    setDone(true);
  }

  if (done) {
    return (
      <div
        style={{
          background: "#0f1f16",
          border: "1px solid #134e35",
          borderRadius: 8,
          padding: 20,
          textAlign: "center",
        }}
      >
        <p style={{ color: "#6ee7b7", fontWeight: 700, marginBottom: 4 }}>지원이 완료되었습니다</p>
        <p style={{ color: "#8a8fa3", fontSize: 13, margin: 0 }}>
          작성자가 '내 알림'에서 지원 내역을 확인할 수 있습니다.
        </p>
        <GhostButton onClick={onDone} style={{ marginTop: 14 }}>
          닫기
        </GhostButton>
      </div>
    );
  }

  return (
    <div style={{ background: "#161822", border: "1px solid #232635", borderRadius: 10, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "#e8e9ee", margin: 0 }}>지원서 작성</h3>
        <button
          onClick={onDone}
          style={{ background: "transparent", border: "none", color: "#767c8d", cursor: "pointer" }}
        >
          <X size={18} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="학과">
          <TextInput value={form.dept} onChange={(e) => set("dept", e.target.value)} placeholder="예: 게임공학과" />
        </Field>
        <Field label="학번">
          <TextInput value={form.studentId} onChange={(e) => set("studentId", e.target.value)} placeholder="예: 20231234" />
        </Field>
        <Field label="학년">
          <Select value={form.grade} onChange={(e) => set("grade", e.target.value)}>
            <option value="1">1학년</option>
            <option value="2">2학년</option>
            <option value="3">3학년</option>
            <option value="4">4학년</option>
            <option value="5">5학년 이상</option>
          </Select>
        </Field>
        <Field label="이름">
          <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="이름" />
        </Field>
      </div>
      <Field label="희망 분야">
        <Select value={form.role} onChange={(e) => set("role", e.target.value)}>
          {post.roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="자기소개">
        <TextArea
          rows={5}
          value={form.intro}
          onChange={(e) => set("intro", e.target.value)}
          placeholder="경험, 포트폴리오, 참여하고 싶은 이유 등을 자유롭게 작성하세요."
        />
      </Field>
      {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <PrimaryButton onClick={submit}>지원 완료</PrimaryButton>
    </div>
  );
}

function ManagePanel({ post, onUpdate, onDelete, onBack }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function check() {
    if (name.trim() === post.author && pin === post.pin) {
      setAuthed(true);
      setError("");
      const applications = post.applications.map((a) => ({ ...a, read: true }));
      onUpdate({ ...post, applications });
    } else {
      setError("이름 또는 PIN이 일치하지 않습니다.");
    }
  }

  if (!authed) {
    return (
      <div style={{ background: "#161822", border: "1px solid #232635", borderRadius: 10, padding: 18 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#c7cad4", marginBottom: 10 }}>
          <Lock size={13} style={{ verticalAlign: -2, marginRight: 5 }} />
          글 관리 (작성자 확인)
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <TextInput
            placeholder="작성자 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: 140 }}
          />
          <TextInput
            placeholder="PIN 4자리"
            value={pin}
            maxLength={4}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            style={{ width: 100 }}
          />
          <GhostButton onClick={check}>확인</GhostButton>
        </div>
        {error && <p style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ background: "#161822", border: "1px solid #232635", borderRadius: 10, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#e8e9ee", margin: 0 }}>지원자 목록 ({post.applications.length})</p>
        <div style={{ display: "flex", gap: 8 }}>
          <GhostButton
            onClick={() => onUpdate({ ...post, status: post.status === "closed" ? "open" : "closed" })}
          >
            {post.status === "closed" ? "모집 재개" : "모집 마감"}
          </GhostButton>
          {!confirmingDelete ? (
            <GhostButton
              onClick={() => setConfirmingDelete(true)}
              style={{ color: "#f87171", borderColor: "#3f2626" }}
            >
              <Trash2 size={13} /> 삭제
            </GhostButton>
          ) : (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#f87171" }}>삭제할까요?</span>
              <GhostButton
                onClick={() => {
                  onDelete(post.id);
                  onBack();
                }}
                style={{ color: "#f87171", borderColor: "#3f2626" }}
              >
                삭제 확정
              </GhostButton>
              <GhostButton onClick={() => setConfirmingDelete(false)}>취소</GhostButton>
            </div>
          )}
        </div>
      </div>
      {post.applications.length === 0 ? (
        <p style={{ color: "#767c8d", fontSize: 13 }}>아직 지원자가 없습니다.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {post.applications
            .slice()
            .sort((a, b) => b.appliedAt - a.appliedAt)
            .map((a) => (
              <div
                key={a.id}
                style={{
                  border: "1px solid #232635",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 13,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: "#e8e9ee" }}>
                    {a.name} <RoleChip id={a.role} small />
                  </span>
                  <span style={{ color: "#767c8d", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    {new Date(a.appliedAt).toLocaleString("ko-KR")}
                  </span>
                </div>
                <p style={{ color: "#8a8fa3", margin: "0 0 4px" }}>
                  {a.dept} · {a.grade}학년 · 학번 {a.studentId}
                </p>
                <p style={{ color: "#c7cad4", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{a.intro}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function DetailView({ post, setView, updatePost, deletePost }) {
  const [applying, setApplying] = useState(false);
  if (!post) return null;
  const dd = dday(post.deadline);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 80px" }}>
      <GhostButton onClick={() => setView("list")} style={{ marginBottom: 20 }}>
        <ArrowLeft size={14} /> 목록으로
      </GhostButton>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        {post.roles.map((r) => (
          <RoleChip key={r} id={r} />
        ))}
        <StatusBadge status={post.status} />
      </div>

      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "#e8e9ee", margin: "0 0 10px" }}>
        {post.title}
      </h1>

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "#767c8d",
          marginBottom: 22,
          paddingBottom: 18,
          borderBottom: "1px solid #232635",
        }}
      >
        <span>작성자 {post.author}</span>
        <span>등록일 {new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Calendar size={12} />
          {post.deadline ? `마감 ${post.deadline}${dd !== null ? ` (${dd < 0 ? "마감됨" : dd === 0 ? "D-DAY" : "D-" + dd})` : ""}` : "상시 모집"}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Users size={12} /> 지원 {post.applications.length}명
        </span>
      </div>

      <p style={{ color: "#c7cad4", lineHeight: 1.8, whiteSpace: "pre-wrap", fontSize: 15, marginBottom: 28 }}>
        {post.content}
      </p>

      {!applying && (
        <PrimaryButton
          disabled={post.status === "closed"}
          onClick={() => setApplying(true)}
          style={{ marginBottom: 32 }}
        >
          {post.status === "closed" ? "모집 마감됨" : "지원하기"}
        </PrimaryButton>
      )}

      {applying && (
        <div style={{ marginBottom: 32 }}>
          <ApplyForm
            post={post}
            onApply={(app) =>
              updatePost({ ...post, applications: [...post.applications, app] })
            }
            onDone={() => setApplying(false)}
          />
        </div>
      )}

      <ManagePanel post={post} onUpdate={updatePost} onDelete={deletePost} onBack={() => setView("list")} />
    </div>
  );
}

function NotifyView({ posts, updatePost }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [checked, setChecked] = useState(false);
  const [matches, setMatches] = useState([]);

  function check() {
    const m = posts.filter((p) => p.author === name.trim() && p.pin === pin);
    setMatches(m);
    setChecked(true);
    m.forEach((p) => {
      if (p.applications.some((a) => !a.read)) {
        updatePost({ ...p, applications: p.applications.map((a) => ({ ...a, read: true })) });
      }
    });
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "36px 20px 80px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "#e8e9ee", marginBottom: 8 }}>
        내 알림
      </h1>
      <p style={{ color: "#8a8fa3", fontSize: 14, marginBottom: 24 }}>
        게시글 등록 시 입력한 이름과 PIN으로 내 프로젝트에 들어온 지원 내역을 확인하세요.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <TextInput placeholder="작성자 이름" value={name} onChange={(e) => setName(e.target.value)} style={{ width: 160 }} />
        <TextInput
          placeholder="PIN 4자리"
          value={pin}
          maxLength={4}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          style={{ width: 110 }}
        />
        <PrimaryButton onClick={check}>조회하기</PrimaryButton>
      </div>

      {checked && matches.length === 0 && (
        <p style={{ color: "#767c8d", fontSize: 13 }}>해당 이름과 PIN으로 등록된 게시글이 없습니다.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {matches.map((p) => (
          <div key={p.id} style={{ background: "#161822", border: "1px solid #232635", borderRadius: 10, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: "#e8e9ee" }}>{p.title}</span>
              <span style={{ fontSize: 12, color: "#7c6cf0", fontWeight: 700 }}>지원 {p.applications.length}건</span>
            </div>
            {p.applications.length === 0 ? (
              <p style={{ color: "#767c8d", fontSize: 13, margin: 0 }}>아직 지원자가 없습니다.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {p.applications
                  .slice()
                  .sort((a, b) => b.appliedAt - a.appliedAt)
                  .map((a) => (
                    <div key={a.id} style={{ fontSize: 13, borderTop: "1px solid #232635", paddingTop: 8 }}>
                      <span style={{ fontWeight: 600, color: "#c7cad4" }}>{a.name}</span>
                      <span style={{ color: "#767c8d" }}> · {a.dept} · {a.grade}학년 · </span>
                      <RoleChip id={a.role} small />
                      <p style={{ color: "#8a8fa3", margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{a.intro}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminView({ posts, deletePost, updatePost }) {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);

  if (!authed) {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "60px 20px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "#e8e9ee", marginBottom: 16 }}>
          <Shield size={18} style={{ verticalAlign: -3, marginRight: 6 }} />
          관리자 로그인
        </h1>
        <TextInput
          type="password"
          placeholder="관리자 비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        <PrimaryButton
          onClick={() => {
            if (pw === ADMIN_PASSWORD) setAuthed(true);
            else setError("비밀번호가 올바르지 않습니다.");
          }}
        >
          로그인
        </PrimaryButton>
        {error && <p style={{ color: "#f87171", fontSize: 13, marginTop: 10 }}>{error}</p>}
      </div>
    );
  }

  const totalApplications = posts.reduce((s, p) => s + p.applications.length, 0);

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 20px 80px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "#e8e9ee", marginBottom: 20 }}>
        관리자 페이지
      </h1>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={{ background: "#161822", border: "1px solid #232635", borderRadius: 8, padding: "14px 20px" }}>
          <p style={{ fontSize: 12, color: "#767c8d", margin: "0 0 4px" }}>전체 게시글</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#e8e9ee", margin: 0 }}>{posts.length}</p>
        </div>
        <div style={{ background: "#161822", border: "1px solid #232635", borderRadius: 8, padding: "14px 20px" }}>
          <p style={{ fontSize: 12, color: "#767c8d", margin: "0 0 4px" }}>전체 지원자</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#e8e9ee", margin: 0 }}>{totalApplications}</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {posts
          .slice()
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((p) => (
            <div
              key={p.id}
              style={{
                background: "#161822",
                border: "1px solid #232635",
                borderRadius: 8,
                padding: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: "#e8e9ee", fontSize: 14 }}>{p.title}</span>
                  <StatusBadge status={p.status} />
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {p.roles.map((r) => (
                    <RoleChip key={r} id={r} small />
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 12, color: "#767c8d", fontFamily: "var(--font-mono)" }}>
                <span>{p.author}</span>
                <span>지원 {p.applications.length}</span>
                <GhostButton
                  onClick={() => updatePost({ ...p, status: p.status === "closed" ? "open" : "closed" })}
                >
                  {p.status === "closed" ? "재개" : "마감"}
                </GhostButton>
                {confirmingId === p.id ? (
                  <>
                    <GhostButton
                      onClick={() => {
                        deletePost(p.id);
                        setConfirmingId(null);
                      }}
                      style={{ color: "#f87171", borderColor: "#3f2626" }}
                    >
                      삭제 확정
                    </GhostButton>
                    <GhostButton onClick={() => setConfirmingId(null)}>취소</GhostButton>
                  </>
                ) : (
                  <GhostButton
                    onClick={() => setConfirmingId(p.id)}
                    style={{ color: "#f87171", borderColor: "#3f2626" }}
                  >
                    <Trash2 size={13} />
                  </GhostButton>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("list");
  const [posts, setPosts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Noto+Sans+KR:wght@400;500;700&family=JetBrains+Mono:wght@500;700&display=swap";
    document.head.appendChild(link);
    document.documentElement.style.setProperty("--font-display", "'Space Grotesk','Noto Sans KR',sans-serif");
    document.documentElement.style.setProperty("--font-body", "'Noto Sans KR',sans-serif");
    document.documentElement.style.setProperty("--font-mono", "'JetBrains Mono',monospace");

    (async () => {
      let data = await loadPosts();
      if (!data) {
        data = seedPosts();
        await savePosts(data);
      }
      setPosts(data);
      setLoading(false);
    })();
  }, []);

  function addPost(post) {
    setPosts((prev) => {
      const next = [post, ...prev];
      savePosts(next);
      return next;
    });
  }

  function updatePost(updated) {
    setPosts((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? updated : p));
      savePosts(next);
      return next;
    });
  }

  function deletePost(id) {
    setPosts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      savePosts(next);
      return next;
    });
  }

  const selectedPost = posts.find((p) => p.id === selectedId);

  return (
    <div style={{ minHeight: "100vh", background: "#0d0e14", fontFamily: "var(--font-body)" }}>
      <Header view={view} setView={setView} />
      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#767c8d" }}>불러오는 중...</div>
      ) : (
        <>
          {view === "list" && <ListView posts={posts} setView={setView} setSelectedId={setSelectedId} />}
          {view === "write" && <WriteView addPost={addPost} setView={setView} />}
          {view === "detail" && (
            <DetailView post={selectedPost} setView={setView} updatePost={updatePost} deletePost={deletePost} />
          )}
          {view === "notify" && <NotifyView posts={posts} updatePost={updatePost} />}
          {view === "admin" && <AdminView posts={posts} deletePost={deletePost} updatePost={updatePost} />}
        </>
      )}
    </div>
  );
}
