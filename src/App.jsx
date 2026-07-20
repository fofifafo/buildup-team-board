import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Search, Bell, Shield, ArrowLeft, Trash2, Users, Calendar, X, Lock,
  LogIn, LogOut, UserPlus, Briefcase, FileText, Phone, CheckCircle, XCircle, RefreshCw,
} from "lucide-react";
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
} from "firebase/auth";
import { db, auth, idToEmail } from "./firebase";

const ROLES = [
  { id: "기획", color: "#8b5cf6", bg: "#231a3d", text: "#c4b5fd" },
  { id: "개발", color: "#22d3ee", bg: "#122b31", text: "#67e8f9" },
  { id: "아트", color: "#f472b6", bg: "#331723", text: "#f9a8d4" },
  { id: "사운드", color: "#fbbf24", bg: "#2e2409", text: "#fcd34d" },
  { id: "공모전", color: "#34d399", bg: "#0e2b20", text: "#6ee7b7" },
  { id: "기타", color: "#94a3b8", bg: "#20242c", text: "#cbd5e1" },
];

function roleMeta(id) {
  return ROLES.find((r) => r.id === id) || ROLES[ROLES.length - 1];
}
function dday(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

/* ---------- 공용 UI ---------- */
function StatusBadge({ status }) {
  const open = status !== "closed";
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
        padding: "3px 8px", borderRadius: 4,
        background: open ? "#0d2b1f" : "#2c2020",
        color: open ? "#6ee7b7" : "#fca5a5",
        border: `1px solid ${open ? "#134e35" : "#3f2626"}`,
      }}
    >
      {open ? "모집중" : "마감"}
    </span>
  );
}
function BoardBadge({ boardType }) {
  const market = boardType === "market";
  return (
    <span
      style={{
        fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
        background: market ? "#2b1f0d" : "#141d33",
        color: market ? "#fdba74" : "#93c5fd",
        border: `1px solid ${market ? "#4a3113" : "#1e3a5f"}`,
      }}
    >
      {market ? "포지션마켓" : "프로젝트 모집"}
    </span>
  );
}
function RoleChip({ id, small }) {
  const m = roleMeta(id);
  return (
    <span
      style={{
        fontSize: small ? 11 : 12, fontWeight: 600,
        padding: small ? "2px 7px" : "3px 9px", borderRadius: 4,
        background: m.bg, color: m.text, border: `1px solid ${m.color}33`, whiteSpace: "nowrap",
      }}
    >
      {id}
    </span>
  );
}
function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#c7cad4", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 12, color: "#767c8d", marginTop: 6 }}>{hint}</p>}
    </div>
  );
}
const inputStyle = {
  width: "100%", boxSizing: "border-box", background: "#181a24",
  border: "1px solid #2e3242", borderRadius: 6, padding: "10px 12px",
  color: "#e8e9ee", fontSize: 14, fontFamily: "var(--font-body)", outline: "none",
};
function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
function TextArea(props) {
  return <textarea {...props} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, ...(props.style || {}) }} />;
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
      type={type} onClick={onClick} disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: disabled ? "#2a2d3a" : "#7c6cf0",
        color: disabled ? "#6b6f80" : "#0d0e14",
        border: "none", borderRadius: 6, padding: "10px 18px",
        fontSize: 14, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-display)", ...style,
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
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "transparent", color: "#c7cad4",
        border: "1px solid #2e3242", borderRadius: 6, padding: "9px 16px",
        fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ---------- 헤더 ---------- */
function Header({ view, setView, currentUser, logout, unreadCount }) {
  const navItem = (key, label, Icon, badge) => (
    <button
      onClick={() => setView(key)}
      style={{
        display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none",
        color: view === key ? "#e8e9ee" : "#8a8fa3", fontWeight: 600, fontSize: 14, cursor: "pointer",
        padding: "6px 4px", borderBottom: view === key ? "2px solid #7c6cf0" : "2px solid transparent",
      }}
    >
      <Icon size={15} />
      {label}
      {badge > 0 && (
        <span style={{ background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 6px", marginLeft: 2 }}>
          {badge}
        </span>
      )}
    </button>
  );
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#0d0e14ee", backdropFilter: "blur(6px)", borderBottom: "1px solid #232635" }}>
      <div
        style={{
          maxWidth: 1040, margin: "0 auto", padding: "14px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
        }}
      >
        <div
          onClick={() => setView("list")}
          style={{
            fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 17, color: "#e8e9ee",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <span style={{ color: "#7c6cf0" }}>&lt;</span>BUILD:UP<span style={{ color: "#7c6cf0" }}>/&gt;</span>
        </div>
        <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
          {currentUser && navItem("list", "홈", Search)}
          {currentUser && navItem("write", "글쓰기", Plus)}
          {currentUser && navItem("notify", "내 알림", Bell, unreadCount)}
          {currentUser?.isAdmin && navItem("admin", "관리자", Shield)}
          {currentUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: "#c7cad4", fontWeight: 600 }}>{currentUser.name}님</span>
              <GhostButton onClick={logout} style={{ padding: "6px 12px", fontSize: 12 }}>
                <LogOut size={13} /> 로그아웃
              </GhostButton>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------- 로그인 / 회원가입 ---------- */
function AuthView() {
  const [tab, setTab] = useState("login");
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    userId: "", pw: "", pw2: "", dept: "", studentId: "", name: "", phone: "", birth: "",
  });
  const [signupError, setSignupError] = useState("");
  const [signupDone, setSignupDone] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function doLogin() {
    if (busy) return;
    setBusy(true);
    setLoginError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, idToEmail(loginId.trim()), loginPw);
      // 프로필 상태 확인
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (!snap.exists()) {
        await signOut(auth);
        setLoginError("삭제되었거나 존재하지 않는 계정입니다. 관리자에게 문의하세요.");
      } else if (snap.data().status === "pending") {
        await signOut(auth);
        setLoginError("아직 관리자 승인 대기 중입니다. 승인 후 로그인할 수 있어요.");
      } else if (snap.data().status === "rejected") {
        await signOut(auth);
        setLoginError("가입이 거절된 계정입니다. 관리자에게 문의하세요.");
      }
      // approved면 onAuthStateChanged가 알아서 화면 전환
    } catch (e) {
      if (e.code === "auth/invalid-credential" || e.code === "auth/user-not-found" || e.code === "auth/wrong-password") {
        setLoginError("아이디 또는 비밀번호가 올바르지 않습니다.");
      } else if (e.code === "auth/too-many-requests") {
        setLoginError("로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.");
      } else {
        setLoginError("로그인 중 오류가 발생했습니다: " + e.code);
      }
    }
    setBusy(false);
  }

  async function doSignup() {
    if (busy) return;
    const { userId, pw, pw2, dept, studentId, name, phone, birth } = form;
    if (!userId.trim() || !pw || !dept.trim() || !studentId.trim() || !name.trim() || !phone.trim() || !birth) {
      setSignupError("모든 항목을 입력해 주세요.");
      return;
    }
    if (!/^[a-zA-Z0-9._-]{3,20}$/.test(userId.trim())) {
      setSignupError("아이디는 3~20자의 영문, 숫자, 점(.), 밑줄(_), 하이픈(-)만 사용할 수 있습니다.");
      return;
    }
    if (pw.length < 6) {
      setSignupError("비밀번호는 6자 이상으로 입력해 주세요.");
      return;
    }
    if (pw !== pw2) {
      setSignupError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    setBusy(true);
    setSignupError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, idToEmail(userId.trim()), pw);
      await setDoc(doc(db, "users", cred.user.uid), {
        userId: userId.trim(),
        dept: dept.trim(),
        studentId: studentId.trim(),
        name: name.trim(),
        phone: phone.trim(),
        birth,
        status: "pending",
        createdAt: Date.now(),
      });
      await signOut(auth);
      setSignupDone(true);
    } catch (e) {
      if (e.code === "auth/email-already-in-use") {
        setSignupError("이미 사용 중인 아이디입니다.");
      } else if (e.code === "auth/weak-password") {
        setSignupError("비밀번호가 너무 짧습니다. 6자 이상 입력해 주세요.");
      } else {
        setSignupError("가입 중 오류가 발생했습니다: " + e.code);
      }
    }
    setBusy(false);
  }

  const tabBtn = (key, label, Icon) => (
    <button
      onClick={() => setTab(key)}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "12px 0", background: "transparent", border: "none", cursor: "pointer",
        color: tab === key ? "#e8e9ee" : "#767c8d", fontWeight: 700, fontSize: 14,
        borderBottom: tab === key ? "2px solid #7c6cf0" : "2px solid #232635",
      }}
    >
      <Icon size={15} /> {label}
    </button>
  );

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "48px 20px 80px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#7c6cf0", letterSpacing: "0.08em", margin: 0 }}>
          MEMBERS ONLY
        </p>
        <p style={{ color: "#8a8fa3", fontSize: 13, marginTop: 6 }}>
          회원 전용 게시판입니다. 로그인 후 이용해 주세요.
        </p>
      </div>
      <div style={{ display: "flex", marginBottom: 28 }}>
        {tabBtn("login", "로그인", LogIn)}
        {tabBtn("signup", "회원가입", UserPlus)}
      </div>

      {tab === "login" && (
        <div>
          <Field label="아이디">
            <TextInput value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="아이디" />
          </Field>
          <Field label="비밀번호">
            <TextInput
              type="password" value={loginPw}
              onChange={(e) => setLoginPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doLogin()}
              placeholder="비밀번호"
            />
          </Field>
          {loginError && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{loginError}</p>}
          <PrimaryButton onClick={doLogin} disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
            {busy ? "확인 중..." : "로그인"}
          </PrimaryButton>
          <p style={{ fontSize: 13, color: "#767c8d", marginTop: 16, textAlign: "center" }}>
            계정이 없다면 회원가입 후 관리자 승인을 받아주세요.
          </p>
        </div>
      )}

      {tab === "signup" &&
        (signupDone ? (
          <div style={{ background: "#0f1f16", border: "1px solid #134e35", borderRadius: 8, padding: 24, textAlign: "center" }}>
            <CheckCircle size={28} style={{ color: "#6ee7b7", marginBottom: 8 }} />
            <p style={{ color: "#6ee7b7", fontWeight: 700, marginBottom: 6 }}>가입 요청이 접수되었습니다</p>
            <p style={{ color: "#8a8fa3", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              관리자 승인이 완료되면 로그인할 수 있습니다.
            </p>
          </div>
        ) : (
          <div>
            <Field label="아이디" hint="3~20자 영문, 숫자, 점, 밑줄, 하이픈">
              <TextInput value={form.userId} onChange={(e) => set("userId", e.target.value)} placeholder="사용할 아이디" />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="비밀번호">
                <TextInput type="password" value={form.pw} onChange={(e) => set("pw", e.target.value)} placeholder="6자 이상" />
              </Field>
              <Field label="비밀번호 확인">
                <TextInput type="password" value={form.pw2} onChange={(e) => set("pw2", e.target.value)} placeholder="다시 입력" />
              </Field>
              <Field label="학과">
                <TextInput value={form.dept} onChange={(e) => set("dept", e.target.value)} placeholder="예: 게임공학과" />
              </Field>
              <Field label="학번">
                <TextInput value={form.studentId} onChange={(e) => set("studentId", e.target.value)} placeholder="예: 20231234" />
              </Field>
              <Field label="이름">
                <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="이름" />
              </Field>
              <Field label="전화번호">
                <TextInput value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="010-0000-0000" />
              </Field>
            </div>
            <Field label="생년월일">
              <TextInput type="date" value={form.birth} onChange={(e) => set("birth", e.target.value)} />
            </Field>
            {signupError && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{signupError}</p>}
            <PrimaryButton onClick={doSignup} disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
              {busy ? "처리 중..." : "가입 요청 보내기"}
            </PrimaryButton>
            <p style={{ fontSize: 12, color: "#767c8d", marginTop: 14, lineHeight: 1.6 }}>
              가입 요청은 관리자에게 전달되며, 승인 후 로그인이 가능합니다.
            </p>
          </div>
        ))}
    </div>
  );
}

/* ---------- 목록 ---------- */
function ListView({ posts, setView, setSelectedId }) {
  const [boardTab, setBoardTab] = useState("project");
  const [roleFilter, setRoleFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return posts
      .filter((p) => (p.boardType || "project") === boardTab)
      .filter((p) => (roleFilter ? p.roles.includes(roleFilter) : true))
      .filter((p) => (statusFilter === "all" ? true : p.status === statusFilter))
      .filter((p) => (q.trim() ? (p.title + p.author).toLowerCase().includes(q.trim().toLowerCase()) : true))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, boardTab, roleFilter, statusFilter, q]);

  const boardTabBtn = (key, label, Icon, desc) => (
    <button
      onClick={() => setBoardTab(key)}
      style={{
        flex: 1, textAlign: "left", padding: "14px 18px", borderRadius: 10, cursor: "pointer",
        background: boardTab === key ? "#1a1c2a" : "#12141d",
        border: `1px solid ${boardTab === key ? "#7c6cf0" : "#232635"}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Icon size={16} style={{ color: boardTab === key ? "#7c6cf0" : "#767c8d" }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: boardTab === key ? "#e8e9ee" : "#8a8fa3" }}>{label}</span>
      </div>
      <p style={{ fontSize: 12, color: "#767c8d", margin: 0 }}>{desc}</p>
    </button>
  );

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 20px 80px" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#7c6cf0", letterSpacing: "0.08em", marginBottom: 8 }}>
          TEAM BUILDING BOARD
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, color: "#e8e9ee", margin: "0 0 8px" }}>
          함께 만들 사람을 찾아보세요
        </h1>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {boardTabBtn("project", "프로젝트 모집", FileText, "기획서를 올리고 팀원의 지원을 받습니다")}
        {boardTabBtn("market", "포지션마켓", Briefcase, "나를 채용하세요! 스펙을 올리면 기획자가 연락합니다")}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 24 }}>
        <button
          onClick={() => setRoleFilter(null)}
          style={{
            fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 20,
            border: `1px solid ${roleFilter === null ? "#7c6cf0" : "#2e3242"}`,
            background: roleFilter === null ? "#7c6cf022" : "transparent",
            color: roleFilter === null ? "#c4b5fd" : "#8a8fa3", cursor: "pointer",
          }}
        >
          전체
        </button>
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRoleFilter(roleFilter === r.id ? null : r.id)}
            style={{
              fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 20,
              border: `1px solid ${roleFilter === r.id ? r.color : "#2e3242"}`,
              background: roleFilter === r.id ? r.color + "22" : "transparent",
              color: roleFilter === r.id ? r.text : "#8a8fa3", cursor: "pointer",
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
            value={q} onChange={(e) => setQ(e.target.value)} placeholder="제목, 작성자 검색"
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ border: "1px dashed #2e3242", borderRadius: 10, padding: "60px 20px", textAlign: "center", color: "#767c8d" }}>
          {boardTab === "market" ? "아직 포지션마켓 게시글이 없습니다. 첫 글을 올려보세요!" : "조건에 맞는 프로젝트가 없습니다."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
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
                  background: "#161822", border: "1px solid #232635", borderRadius: 10, padding: 18,
                  cursor: "pointer", display: "flex", flexDirection: "column", gap: 10, transition: "border-color .15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3a3f52")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#232635")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {p.roles.map((r) => <RoleChip key={r} id={r} small />)}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "#e8e9ee", margin: 0, lineHeight: 1.3 }}>
                  {p.title}
                </h3>
                <p
                  style={{
                    color: "#8a8fa3", fontSize: 13, margin: 0, display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5, minHeight: 39,
                  }}
                >
                  {p.content}
                </p>
                <div
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    fontFamily: "var(--font-mono)", fontSize: 12, color: "#767c8d",
                    marginTop: 4, borderTop: "1px solid #232635", paddingTop: 10,
                  }}
                >
                  <span>{p.author}</span>
                  {p.deadline ? (
                    <span style={{ color: dd !== null && dd < 0 ? "#767c8d" : "#f5a524" }}>
                      {dd === null ? "" : dd < 0 ? "마감됨" : dd === 0 ? "D-DAY" : `D-${dd}`}
                    </span>
                  ) : (
                    <span>상시</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- 글쓰기 ---------- */
function WriteView({ setView, currentUser }) {
  const [boardType, setBoardType] = useState("project");
  const [title, setTitle] = useState("");
  const [roles, setRoles] = useState([]);
  const [deadline, setDeadline] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function toggleRole(id) {
    setRoles((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  async function submit() {
    if (busy) return;
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력해 주세요.");
      return;
    }
    if (roles.length === 0) {
      setError(boardType === "market" ? "희망 분야를 하나 이상 선택해 주세요." : "모집 분야를 하나 이상 선택해 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await addDoc(collection(db, "posts"), {
        boardType,
        title: title.trim(),
        author: currentUser.name,
        authorUid: currentUser.uid,
        roles,
        content: content.trim(),
        deadline,
        status: "open",
        createdAt: Date.now(),
      });
      setView("list");
    } catch (e) {
      setError("등록 중 오류가 발생했습니다: " + e.code);
    }
    setBusy(false);
  }

  const isMarket = boardType === "market";

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "36px 20px 80px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "#e8e9ee", marginBottom: 20 }}>
        글쓰기
      </h1>

      <Field label="게시판 선택">
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { key: "project", label: "프로젝트 모집", desc: "기획서를 올려 팀원 모집" },
            { key: "market", label: "포지션마켓", desc: "나를 채용하세요! 스펙 홍보" },
          ].map((b) => (
            <button
              key={b.key} type="button" onClick={() => setBoardType(b.key)}
              style={{
                flex: 1, padding: "12px 14px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                background: boardType === b.key ? "#1a1c2a" : "transparent",
                border: `1px solid ${boardType === b.key ? "#7c6cf0" : "#2e3242"}`,
              }}
            >
              <span style={{ display: "block", fontWeight: 700, fontSize: 14, color: boardType === b.key ? "#e8e9ee" : "#8a8fa3" }}>
                {b.label}
              </span>
              <span style={{ fontSize: 12, color: "#767c8d" }}>{b.desc}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="제목">
        <TextInput
          value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder={isMarket ? "예: 유니티 클라이언트 개발 가능합니다!" : "프로젝트 제목을 입력하세요"}
        />
      </Field>

      <Field label={isMarket ? "희망 분야 (복수 선택 가능)" : "모집 분야 (복수 선택 가능)"}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ROLES.map((r) => (
            <button
              key={r.id} type="button" onClick={() => toggleRole(r.id)}
              style={{
                fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 6,
                border: `1px solid ${roles.includes(r.id) ? r.color : "#2e3242"}`,
                background: roles.includes(r.id) ? r.color + "22" : "transparent",
                color: roles.includes(r.id) ? r.text : "#8a8fa3", cursor: "pointer",
              }}
            >
              {r.id}
            </button>
          ))}
        </div>
      </Field>

      {!isMarket && (
        <Field label="마감일 (선택)">
          <TextInput type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
      )}

      <Field label={isMarket ? "자기소개 / 스펙" : "기획 내용"}>
        <TextArea
          rows={10} value={content} onChange={(e) => setContent(e.target.value)}
          placeholder={
            isMarket
              ? "보유 기술, 사용 가능한 툴, 참여 경험, 포트폴리오 링크, 활동 가능 시간 등을 자유롭게 작성하세요."
              : "장르와 컨셉, 핵심 재미 요소, 필요한 인원과 역할, 진행 방식 등을 자유롭게 작성하세요."
          }
        />
      </Field>

      {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: "flex", gap: 10 }}>
        <PrimaryButton onClick={submit} disabled={busy}>{busy ? "등록 중..." : "등록하기"}</PrimaryButton>
        <GhostButton onClick={() => setView("list")}>취소</GhostButton>
      </div>
    </div>
  );
}

/* ---------- 지원/연락 폼 ---------- */
function ResponseForm({ post, currentUser, onDone, refreshInbox }) {
  const isMarket = (post.boardType || "project") === "market";
  const [form, setForm] = useState({
    dept: currentUser.dept || "",
    studentId: currentUser.studentId || "",
    grade: "1",
    name: currentUser.name || "",
    role: post.roles[0],
    intro: "",
    contactInfo: currentUser.phone || "",
    message: "",
  });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    if (busy) return;
    if (isMarket) {
      if (!form.message.trim() || !form.contactInfo.trim()) {
        setError("연락처와 메시지를 모두 입력해 주세요.");
        return;
      }
    } else {
      if (!form.dept.trim() || !form.studentId.trim() || !form.name.trim() || !form.intro.trim()) {
        setError("모든 항목을 입력해 주세요.");
        return;
      }
    }
    setBusy(true);
    setError("");
    try {
      const base = {
        postAuthorUid: post.authorUid,
        fromUid: currentUser.uid,
        read: false,
        sentAt: Date.now(),
        type: isMarket ? "contact" : "application",
      };
      const payload = isMarket
        ? { ...base, fromName: currentUser.name, fromDept: currentUser.dept, contactInfo: form.contactInfo.trim(), message: form.message.trim() }
        : { ...base, dept: form.dept.trim(), studentId: form.studentId.trim(), grade: form.grade, name: form.name.trim(), role: form.role, intro: form.intro.trim() };
      await addDoc(collection(db, "posts", post.id, "responses"), payload);
      setDone(true);
    } catch (e) {
      setError("전송 중 오류가 발생했습니다: " + e.code);
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div style={{ background: "#0f1f16", border: "1px solid #134e35", borderRadius: 8, padding: 20, textAlign: "center" }}>
        <p style={{ color: "#6ee7b7", fontWeight: 700, marginBottom: 4 }}>
          {isMarket ? "연락이 전달되었습니다" : "지원이 완료되었습니다"}
        </p>
        <p style={{ color: "#8a8fa3", fontSize: 13, margin: 0 }}>작성자의 '내 알림'으로 전달되었습니다.</p>
        <GhostButton onClick={onDone} style={{ marginTop: 14 }}>닫기</GhostButton>
      </div>
    );
  }

  return (
    <div style={{ background: "#161822", border: "1px solid #232635", borderRadius: 10, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "#e8e9ee", margin: 0 }}>
          {isMarket ? "연락하기" : "지원서 작성"}
        </h3>
        <button onClick={onDone} style={{ background: "transparent", border: "none", color: "#767c8d", cursor: "pointer" }}>
          <X size={18} />
        </button>
      </div>

      {isMarket ? (
        <>
          <Field label="회신받을 연락처" hint="상대방에게 전달됩니다 (전화번호, 카톡 ID, 디스코드 등)">
            <TextInput value={form.contactInfo} onChange={(e) => set("contactInfo", e.target.value)} placeholder="예: 010-0000-0000 / 카톡ID" />
          </Field>
          <Field label="메시지">
            <TextArea
              rows={5} value={form.message} onChange={(e) => set("message", e.target.value)}
              placeholder="어떤 프로젝트인지, 어떤 역할을 제안하는지 등을 작성하세요."
            />
          </Field>
        </>
      ) : (
        <>
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
              {post.roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label="자기소개">
            <TextArea
              rows={5} value={form.intro} onChange={(e) => set("intro", e.target.value)}
              placeholder="경험, 포트폴리오, 참여하고 싶은 이유 등을 자유롭게 작성하세요."
            />
          </Field>
        </>
      )}
      {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <PrimaryButton onClick={submit} disabled={busy}>
        {busy ? "전송 중..." : isMarket ? "보내기" : "지원 완료"}
      </PrimaryButton>
    </div>
  );
}

/* ---------- 응답(지원/연락) 카드 ---------- */
function ResponseCard({ r, compact }) {
  const isContact = r.type === "contact";
  return (
    <div style={{ border: compact ? "none" : "1px solid #232635", borderTop: compact ? "1px solid #232635" : undefined, borderRadius: compact ? 0 : 8, padding: compact ? "8px 0 0" : 12, fontSize: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 4 }}>
        <span style={{ fontWeight: 700, color: "#e8e9ee" }}>
          {isContact ? (
            <>{r.fromName} <span style={{ color: "#767c8d", fontWeight: 400 }}>({r.fromDept})</span></>
          ) : (
            <>{r.name} <RoleChip id={r.role} small /></>
          )}
        </span>
        <span style={{ color: "#767c8d", fontFamily: "var(--font-mono)", fontSize: 11 }}>
          {new Date(r.sentAt).toLocaleString("ko-KR")}
        </span>
      </div>
      {isContact ? (
        <>
          <p style={{ color: "#fdba74", margin: "0 0 4px", fontSize: 12 }}>연락처: {r.contactInfo}</p>
          <p style={{ color: "#c7cad4", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{r.message}</p>
        </>
      ) : (
        <>
          <p style={{ color: "#8a8fa3", margin: "0 0 4px" }}>{r.dept} · {r.grade}학년 · 학번 {r.studentId}</p>
          <p style={{ color: "#c7cad4", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{r.intro}</p>
        </>
      )}
    </div>
  );
}

/* ---------- 상세 ---------- */
function DetailView({ post, setView, currentUser, refreshInbox }) {
  const [responding, setResponding] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [responses, setResponses] = useState(null);
  const [busy, setBusy] = useState(false);

  const isMarket = (post?.boardType || "project") === "market";
  const isOwner = currentUser && post && currentUser.uid === post.authorUid;
  const canManage = isOwner || currentUser?.isAdmin;

  useEffect(() => {
    if (!post || !canManage) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "posts", post.id, "responses"));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setResponses(list);
        // 읽음 처리 (작성자 본인일 때만)
        if (isOwner) {
          await Promise.all(
            list.filter((r) => !r.read).map((r) => updateDoc(doc(db, "posts", post.id, "responses", r.id), { read: true }))
          );
          refreshInbox();
        }
      } catch (e) {
        console.error("응답 불러오기 실패", e);
        setResponses([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  if (!post) return null;
  const dd = dday(post.deadline);

  async function toggleStatus() {
    await updateDoc(doc(db, "posts", post.id), { status: post.status === "closed" ? "open" : "closed" });
  }
  async function removePost() {
    if (busy) return;
    setBusy(true);
    try {
      const snap = await getDocs(collection(db, "posts", post.id, "responses"));
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
      await deleteDoc(doc(db, "posts", post.id));
      setView("list");
    } catch (e) {
      console.error("삭제 실패", e);
    }
    setBusy(false);
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 80px" }}>
      <GhostButton onClick={() => setView("list")} style={{ marginBottom: 20 }}>
        <ArrowLeft size={14} /> 목록으로
      </GhostButton>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <BoardBadge boardType={post.boardType || "project"} />
        {post.roles.map((r) => <RoleChip key={r} id={r} />)}
        <StatusBadge status={post.status} />
      </div>

      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "#e8e9ee", margin: "0 0 10px" }}>
        {post.title}
      </h1>

      <div
        style={{
          display: "flex", gap: 16, flexWrap: "wrap", fontFamily: "var(--font-mono)", fontSize: 12,
          color: "#767c8d", marginBottom: 22, paddingBottom: 18, borderBottom: "1px solid #232635",
        }}
      >
        <span>작성자 {post.author}</span>
        <span>등록일 {new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
        {!isMarket && (
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar size={12} />
            {post.deadline
              ? `마감 ${post.deadline}${dd !== null ? ` (${dd < 0 ? "마감됨" : dd === 0 ? "D-DAY" : "D-" + dd})` : ""}`
              : "상시 모집"}
          </span>
        )}
      </div>

      <p style={{ color: "#c7cad4", lineHeight: 1.8, whiteSpace: "pre-wrap", fontSize: 15, marginBottom: 28 }}>
        {post.content}
      </p>

      {!isOwner && !responding && (
        <PrimaryButton
          disabled={post.status === "closed"}
          onClick={() => setResponding(true)}
          style={{ marginBottom: 32 }}
        >
          {post.status === "closed" ? "마감됨" : isMarket ? "연락하기" : "지원하기"}
        </PrimaryButton>
      )}

      {responding && (
        <div style={{ marginBottom: 32 }}>
          <ResponseForm post={post} currentUser={currentUser} onDone={() => setResponding(false)} refreshInbox={refreshInbox} />
        </div>
      )}

      {canManage && (
        <div style={{ background: "#161822", border: "1px solid #232635", borderRadius: 10, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#e8e9ee", margin: 0 }}>
              {isMarket ? `받은 연락 (${responses ? responses.length : "..."})` : `지원자 목록 (${responses ? responses.length : "..."})`}
            </p>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <GhostButton onClick={toggleStatus}>
                {post.status === "closed" ? "모집 재개" : "마감하기"}
              </GhostButton>
              {!confirmingDelete ? (
                <GhostButton onClick={() => setConfirmingDelete(true)} style={{ color: "#f87171", borderColor: "#3f2626" }}>
                  <Trash2 size={13} /> 삭제
                </GhostButton>
              ) : (
                <>
                  <span style={{ fontSize: 12, color: "#f87171" }}>삭제할까요?</span>
                  <GhostButton onClick={removePost} style={{ color: "#f87171", borderColor: "#3f2626" }}>
                    {busy ? "삭제 중..." : "삭제 확정"}
                  </GhostButton>
                  <GhostButton onClick={() => setConfirmingDelete(false)}>취소</GhostButton>
                </>
              )}
            </div>
          </div>
          {!responses ? (
            <p style={{ color: "#767c8d", fontSize: 13 }}>불러오는 중...</p>
          ) : responses.length === 0 ? (
            <p style={{ color: "#767c8d", fontSize: 13 }}>{isMarket ? "아직 받은 연락이 없습니다." : "아직 지원자가 없습니다."}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {responses
                .slice()
                .sort((a, b) => b.sentAt - a.sentAt)
                .map((r) => <ResponseCard key={r.id} r={r} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- 내 알림 ---------- */
function NotifyView({ inbox, refreshInbox }) {
  useEffect(() => {
    // 열람 시 모두 읽음 처리
    (async () => {
      const unread = [];
      inbox.forEach(({ post, responses }) => {
        responses.filter((r) => !r.read).forEach((r) => unread.push({ postId: post.id, rid: r.id }));
      });
      if (unread.length > 0) {
        await Promise.all(unread.map(({ postId, rid }) => updateDoc(doc(db, "posts", postId, "responses", rid), { read: true })));
        refreshInbox();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "36px 20px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "#e8e9ee", margin: 0 }}>
          내 알림
        </h1>
        <GhostButton onClick={refreshInbox} style={{ padding: "6px 12px", fontSize: 12 }}>
          <RefreshCw size={13} /> 새로고침
        </GhostButton>
      </div>
      <p style={{ color: "#8a8fa3", fontSize: 14, marginBottom: 24 }}>
        내가 올린 글에 들어온 지원서와 연락을 확인할 수 있습니다.
      </p>

      {inbox.length === 0 ? (
        <p style={{ color: "#767c8d", fontSize: 13 }}>아직 작성한 게시글이 없습니다.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {inbox.map(({ post, responses }) => {
            const isMarket = (post.boardType || "project") === "market";
            return (
              <div key={post.id} style={{ background: "#161822", border: "1px solid #232635", borderRadius: 10, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, color: "#e8e9ee", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <BoardBadge boardType={post.boardType || "project"} /> {post.title}
                  </span>
                  <span style={{ fontSize: 12, color: "#7c6cf0", fontWeight: 700 }}>
                    {isMarket ? `연락 ${responses.length}건` : `지원 ${responses.length}건`}
                  </span>
                </div>
                {responses.length === 0 ? (
                  <p style={{ color: "#767c8d", fontSize: 13, margin: 0 }}>
                    {isMarket ? "아직 받은 연락이 없습니다." : "아직 지원자가 없습니다."}
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {responses
                      .slice()
                      .sort((a, b) => b.sentAt - a.sentAt)
                      .map((r) => <ResponseCard key={r.id} r={r} compact />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- 관리자 ---------- */
function AdminView({ posts, currentUser }) {
  const [tab, setTab] = useState("users");
  const [userList, setUserList] = useState(null);
  const [confirmingPostId, setConfirmingPostId] = useState(null);
  const [confirmingUserId, setConfirmingUserId] = useState(null);
  const [error, setError] = useState("");

  async function fetchUsers() {
    try {
      const snap = await getDocs(collection(db, "users"));
      setUserList(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
      setError("");
    } catch (e) {
      setError("회원 목록을 불러올 수 없습니다. 관리자 권한(isAdmin)이 설정되었는지 확인하세요.");
      setUserList([]);
    }
  }
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setUserStatus(uid, status) {
    await updateDoc(doc(db, "users", uid), { status });
    fetchUsers();
  }
  async function removeUser(uid) {
    await deleteDoc(doc(db, "users", uid));
    setConfirmingUserId(null);
    fetchUsers();
  }
  async function togglePostStatus(p) {
    await updateDoc(doc(db, "posts", p.id), { status: p.status === "closed" ? "open" : "closed" });
  }
  async function removePost(p) {
    const snap = await getDocs(collection(db, "posts", p.id, "responses"));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(db, "posts", p.id));
    setConfirmingPostId(null);
  }

  const pending = (userList || []).filter((u) => u.status === "pending");
  const approved = (userList || []).filter((u) => u.status === "approved");

  const tabBtn = (key, label, count) => (
    <button
      onClick={() => setTab(key)}
      style={{
        padding: "10px 18px", background: "transparent", border: "none", cursor: "pointer",
        color: tab === key ? "#e8e9ee" : "#767c8d", fontWeight: 700, fontSize: 14,
        borderBottom: tab === key ? "2px solid #7c6cf0" : "2px solid transparent",
      }}
    >
      {label}
      {count > 0 && (
        <span style={{ background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 6px", marginLeft: 6 }}>
          {count}
        </span>
      )}
    </button>
  );

  const userRow = (u, actions) => (
    <div
      key={u.uid}
      style={{
        background: "#161822", border: "1px solid #232635", borderRadius: 8, padding: 14,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
      }}
    >
      <div style={{ fontSize: 13 }}>
        <span style={{ fontWeight: 700, color: "#e8e9ee" }}>{u.name}</span>
        <span style={{ color: "#7c6cf0", marginLeft: 8, fontFamily: "var(--font-mono)" }}>@{u.userId}</span>
        {u.isAdmin && <span style={{ marginLeft: 8, fontSize: 11, color: "#fbbf24" }}>관리자</span>}
        <p style={{ color: "#8a8fa3", margin: "4px 0 0" }}>
          {u.dept} · 학번 {u.studentId} · {u.phone} · {u.birth}
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 20px 80px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "#e8e9ee", marginBottom: 20 }}>
        관리자 페이지
      </h1>
      {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 16 }}>{error}</p>}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          ["전체 게시글", posts.length],
          ["승인된 회원", approved.length],
          ["승인 대기", pending.length],
        ].map(([label, val]) => (
          <div key={label} style={{ background: "#161822", border: "1px solid #232635", borderRadius: 8, padding: "14px 20px" }}>
            <p style={{ fontSize: 12, color: "#767c8d", margin: "0 0 4px" }}>{label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#e8e9ee", margin: 0 }}>{val}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #232635", marginBottom: 20 }}>
        {tabBtn("users", "회원 관리", pending.length)}
        {tabBtn("posts", "게시글 관리", 0)}
      </div>

      {tab === "users" && (
        <div>
          {userList === null ? (
            <p style={{ color: "#767c8d", fontSize: 13 }}>불러오는 중...</p>
          ) : (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e8e9ee", marginBottom: 12 }}>승인 대기 ({pending.length})</h3>
              {pending.length === 0 ? (
                <p style={{ color: "#767c8d", fontSize: 13, marginBottom: 24 }}>대기 중인 가입 요청이 없습니다.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
                  {pending.map((u) =>
                    userRow(u, (
                      <>
                        <GhostButton onClick={() => setUserStatus(u.uid, "approved")} style={{ color: "#6ee7b7", borderColor: "#134e35" }}>
                          <CheckCircle size={13} /> 승인
                        </GhostButton>
                        <GhostButton onClick={() => setUserStatus(u.uid, "rejected")} style={{ color: "#f87171", borderColor: "#3f2626" }}>
                          <XCircle size={13} /> 거절
                        </GhostButton>
                      </>
                    ))
                  )}
                </div>
              )}

              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e8e9ee", marginBottom: 12 }}>승인된 회원 ({approved.length})</h3>
              {approved.length === 0 ? (
                <p style={{ color: "#767c8d", fontSize: 13 }}>승인된 회원이 없습니다.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {approved.map((u) =>
                    userRow(u,
                      u.uid === currentUser.uid ? (
                        <span style={{ fontSize: 12, color: "#767c8d" }}>본인</span>
                      ) : confirmingUserId === u.uid ? (
                        <>
                          <span style={{ fontSize: 12, color: "#f87171" }}>삭제할까요?</span>
                          <GhostButton onClick={() => removeUser(u.uid)} style={{ color: "#f87171", borderColor: "#3f2626" }}>
                            삭제 확정
                          </GhostButton>
                          <GhostButton onClick={() => setConfirmingUserId(null)}>취소</GhostButton>
                        </>
                      ) : (
                        <GhostButton onClick={() => setConfirmingUserId(u.uid)} style={{ color: "#f87171", borderColor: "#3f2626" }}>
                          <Trash2 size={13} /> 계정 삭제
                        </GhostButton>
                      )
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === "posts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {posts
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#161822", border: "1px solid #232635", borderRadius: 8, padding: 14,
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
                }}
              >
                <div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                    <BoardBadge boardType={p.boardType || "project"} />
                    <span style={{ fontWeight: 700, color: "#e8e9ee", fontSize: 14 }}>{p.title}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {p.roles.map((r) => <RoleChip key={r} id={r} small />)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 12, color: "#767c8d", fontFamily: "var(--font-mono)" }}>
                  <span>{p.author}</span>
                  <GhostButton onClick={() => togglePostStatus(p)}>
                    {p.status === "closed" ? "재개" : "마감"}
                  </GhostButton>
                  {confirmingPostId === p.id ? (
                    <>
                      <GhostButton onClick={() => removePost(p)} style={{ color: "#f87171", borderColor: "#3f2626" }}>
                        삭제 확정
                      </GhostButton>
                      <GhostButton onClick={() => setConfirmingPostId(null)}>취소</GhostButton>
                    </>
                  ) : (
                    <GhostButton onClick={() => setConfirmingPostId(p.id)} style={{ color: "#f87171", borderColor: "#3f2626" }}>
                      <Trash2 size={13} />
                    </GhostButton>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

/* ---------- App ---------- */
export default function App() {
  const [view, setView] = useState("list");
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [inbox, setInbox] = useState([]); // [{post, responses}]

  // 폰트 로드
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Noto+Sans+KR:wght@400;500;700&family=JetBrains+Mono:wght@500;700&display=swap";
    document.head.appendChild(link);
    document.documentElement.style.setProperty("--font-display", "'Space Grotesk','Noto Sans KR',sans-serif");
    document.documentElement.style.setProperty("--font-body", "'Noto Sans KR',sans-serif");
    document.documentElement.style.setProperty("--font-mono", "'JetBrains Mono',monospace");
  }, []);

  // 로그인 상태 감시
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setCurrentUser(null);
        setPosts([]);
        setInbox([]);
        setAuthChecked(true);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", fbUser.uid));
        if (snap.exists() && snap.data().status === "approved") {
          setCurrentUser({ uid: fbUser.uid, ...snap.data() });
        } else {
          await signOut(auth);
          setCurrentUser(null);
        }
      } catch (e) {
        await signOut(auth);
        setCurrentUser(null);
      }
      setAuthChecked(true);
    });
    return unsub;
  }, []);

  // 승인된 사용자 로그인 시 게시글 실시간 구독
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(
      collection(db, "posts"),
      (snap) => {
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (e) => console.error("게시글 구독 실패", e)
    );
    refreshInbox();
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  async function refreshInbox() {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const myPostsSnap = await getDocs(query(collection(db, "posts"), where("authorUid", "==", user.uid)));
      const items = await Promise.all(
        myPostsSnap.docs.map(async (d) => {
          const rSnap = await getDocs(collection(db, "posts", d.id, "responses"));
          return {
            post: { id: d.id, ...d.data() },
            responses: rSnap.docs.map((r) => ({ id: r.id, ...r.data() })),
          };
        })
      );
      items.sort((a, b) => b.post.createdAt - a.post.createdAt);
      setInbox(items);
    } catch (e) {
      console.error("알림 불러오기 실패", e);
    }
  }

  async function logout() {
    await signOut(auth);
    setView("list");
  }

  const unreadCount = inbox.reduce((s, { responses }) => s + responses.filter((r) => !r.read).length, 0);
  const selectedPost = posts.find((p) => p.id === selectedId);

  return (
    <div style={{ minHeight: "100vh", background: "#0d0e14", fontFamily: "var(--font-body)" }}>
      <Header view={view} setView={setView} currentUser={currentUser} logout={logout} unreadCount={unreadCount} />
      {!authChecked ? (
        <div style={{ padding: 60, textAlign: "center", color: "#767c8d" }}>불러오는 중...</div>
      ) : !currentUser ? (
        <AuthView />
      ) : (
        <>
          {view === "list" && <ListView posts={posts} setView={setView} setSelectedId={setSelectedId} />}
          {view === "write" && <WriteView setView={setView} currentUser={currentUser} />}
          {view === "detail" && (
            <DetailView post={selectedPost} setView={setView} currentUser={currentUser} refreshInbox={refreshInbox} />
          )}
          {view === "notify" && <NotifyView inbox={inbox} refreshInbox={refreshInbox} />}
          {view === "admin" && currentUser.isAdmin && <AdminView posts={posts} currentUser={currentUser} />}
        </>
      )}
    </div>
  );
}
