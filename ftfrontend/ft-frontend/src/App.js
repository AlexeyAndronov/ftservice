import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const API_BASE = 'http://localhost:8000';

function App() {
  const [fts, setFts] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCompleted, setEditCompleted] = useState(false);
  const [editEnabled, setEditEnabled] = useState(true);

  // Состояние для тоста
  const [toast, setToast] = useState({ visible: false, message: '' });
  const toastTimerRef = useRef(null);

  // Показ тоста
  const showToast = useCallback((message) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ visible: true, message });
    toastTimerRef.current = setTimeout(() => {
      setToast({ visible: false, message: '' });
    }, 10000);
  }, []);

  // Скрыть тост вручную
  const hideToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast({ visible: false, message: '' });
  }, []);

  // Загрузка списка
  const fetchFTList = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/ftlist`);
      const data = await res.json();
      setFts(data);
    } catch (err) {
      console.error('Ошибка загрузки списка:', err);
      showToast('Не удалось загрузить список FT');
    }
  }, [showToast]);

  useEffect(() => {
    fetchFTList();
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [fetchFTList]);

  // Добавление
  const addFT = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/addft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          completed: false,
          enabled: false,
        }),
      });
      if (res.ok) {
        setNewTitle('');
        setNewDesc('');
        fetchFTList();
      } else {
        const errorData = await res.json();
        showToast(errorData.detail || `Ошибка ${res.status}`);
      }
    } catch (err) {
      console.error('Ошибка добавления:', err);
      showToast('Ошибка сети при добавлении FT');
    }
  };

  // Удаление
  const deleteFT = async (id) => {
    if (!window.confirm('Удалить задачу?')) return;
    try {
      const res = await fetch(`${API_BASE}/deleteft/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchFTList();
      } else {
        const errorData = await res.json();
        showToast(errorData.detail || 'Ошибка удаления');
      }
    } catch (err) {
      console.error('Ошибка удаления:', err);
      showToast('Ошибка сети при удалении');
    }
  };

  // Переключение состояния
  const toggleFT = async (ft) => {
    const newEnabled = !ft.enabled;
    try {
      const res = await fetch(`${API_BASE}/setft/${encodeURIComponent(ft.title)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newEnabled }),
      });
      if (res.ok) {
        fetchFTList();
      } else {
        const errorData = await res.json();
        showToast(errorData.detail || 'Ошибка переключения состояния');
      }
    } catch (err) {
      console.error('Ошибка сети:', err);
      showToast('Ошибка сети при переключении');
    }
  };

  // Начало редактирования
  const startEdit = (ft) => {
    setEditingId(ft.id);
    setEditTitle(ft.title);
    setEditDesc(ft.description || '');
    setEditCompleted(ft.completed);
    setEditEnabled(ft.enabled);
  };

  // Сохранение редактирования
  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/editft/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          completed: editCompleted,
          enabled: editEnabled,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchFTList();
      } else {
        const errorData = await res.json();
        showToast(errorData.detail || 'Ошибка редактирования');
      }
    } catch (err) {
      console.error('Ошибка редактирования:', err);
      showToast('Ошибка сети при редактировании');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="App">
      <h1>📋 FT Manager</h1>

      {toast.visible && (
        <div className="toast" onClick={hideToast}>
          {toast.message}
          <span className="toast-close">✕</span>
        </div>
      )}

      <form onSubmit={addFT} className="add-form">
        <input
          type="text"
          placeholder="Код FT"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Описание (необязательно)"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
        />
        <button type="submit">➕ Добавить</button>
      </form>

      <div className="ft-list">
        {fts.length === 0 ? (
          <p>Не ни одного FT. Добавьте первый</p>
        ) : (
          fts.map((ft) => (
            <div key={ft.id} className="ft-item">
              {editingId === ft.id ? (
                <form onSubmit={saveEdit} className="edit-form">
                  <input
                    type="text"
                    placeholder="Код FT"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Описание"
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={editCompleted}
                      onChange={(e) => setEditCompleted(e.target.checked)}
                    />
                    Выполнено
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={editEnabled}
                      onChange={(e) => setEditEnabled(e.target.checked)}
                    />
                    Включено
                  </label>
                  <div className="edit-actions">
                    <button type="submit">💾 Сохранить</button>
                    <button type="button" onClick={cancelEdit}>❌ Отмена</button>
                  </div>
                </form>
              ) : (
                <div className="ft-view">
                  <div className="ft-header">
                    <h3>{ft.title}</h3>
                    {ft.description && <span className="ft-desc-inline">{ft.description}</span>}
                  </div>
                  <div className="ft-row">
                    <div className="ft-state">
                      <span>{ft.enabled ? '🟢 Включен' : '🔴 Выключен'}</span>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={ft.enabled}
                          onChange={() => toggleFT(ft)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="ft-actions">
                      <button className="edit-btn" onClick={() => startEdit(ft)}>✏️</button>
                      <button className="delete-btn" onClick={() => deleteFT(ft.id)}>🗑️</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;