import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchFTList();
  }, []);

  const fetchFTList = async () => {
    try {
      const res = await fetch(`${API_BASE}/ftlist`);
      const data = await res.json();
      setFts(data);
    } catch (err) {
      console.error('Ошибка загрузки списка:', err);
    }
  };

  const addFT = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/addft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDesc, completed: false, enabled: true }),
      });
      if (res.ok) {
        setNewTitle('');
        setNewDesc('');
        fetchFTList();
      }
    } catch (err) {
      console.error('Ошибка добавления:', err);
    }
  };

  const deleteFT = async (id) => {
    if (!window.confirm('Удалить задачу?')) return;
    try {
      const res = await fetch(`${API_BASE}/deleteft/${id}`, { method: 'DELETE' });
      if (res.ok) fetchFTList();
    } catch (err) {
      console.error('Ошибка удаления:', err);
    }
  };

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
        console.error('Ошибка при переключении');
      }
    } catch (err) {
      console.error('Ошибка сети:', err);
    }
  };

  const startEdit = (ft) => {
    setEditingId(ft.id);
    setEditTitle(ft.title);
    setEditDesc(ft.description || '');
    setEditCompleted(ft.completed);
    setEditEnabled(ft.enabled);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/editft/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, description: editDesc, completed: editCompleted, enabled: editEnabled }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchFTList();
      }
    } catch (err) {
      console.error('Ошибка редактирования:', err);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="App">
      <h1>📋 FT Manager</h1>

      <form onSubmit={addFT} className="add-form">
        <input
          type="text"
          placeholder="Код FT"                     // <-- изменено
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
          <p>Нет ни одного Feature Toggle. Добавьте первый!</p>
        ) : (
          fts.map((ft) => (
            <div key={ft.id} className="ft-item">
              {editingId === ft.id ? (
                <form onSubmit={saveEdit} className="edit-form">
                  <input
                    type="text"
                    placeholder="Код FT"          // <-- изменено
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
                  {/* Название и описание в одной строке */}
                  <div className="ft-header">
                    <h3>{ft.title}</h3>
                    {ft.description && <span className="ft-desc-inline">{ft.description}</span>}
                  </div>

                  <div className="ft-row">
                    <div className="ft-state">
                      <span>{ft.enabled ? '🟢 Включена' : '🔴 Выключена'}</span>
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