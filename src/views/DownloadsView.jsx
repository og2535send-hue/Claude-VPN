import React, { useEffect, useState } from 'react';
import { FaPause, FaPlay, FaTimes, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { useAppStore } from '../store/useAppStore';

export default function DownloadsView() {
  const downloads = useAppStore((s) => s.downloads);
  const refreshDownloads = useAppStore((s) => s.refreshDownloads);
  const settings = useAppStore((s) => s.settings);
  const currentUser = useAppStore((s) => s.currentUser);

  const [progressMap, setProgressMap] = useState({});
  const [speedLimit, setSpeedLimit] = useState(settings?.download_limit_mbps || 0);
  const [maxConcurrent, setMaxConcurrent] = useState(2);
  const [nightOnly, setNightOnly] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setProgressMap((prev) => {
        const next = { ...prev };
        let didChange = false;
        const active = downloads.filter((d) => d.status === 'downloading');
        active.forEach((d) => {
          const cur = next[d.id] || { progress: d.progress || 0, speed: 50 };
          const baseSpeed = Math.max(5, 50 + (Math.random() - 0.5) * 20);
          const effectiveSpeed = speedLimit > 0 ? Math.min(baseSpeed, speedLimit) : baseSpeed;
          const inc = (effectiveSpeed / d.size_gb / 1024) * 100 * 0.5;
          cur.progress = Math.min(100, cur.progress + inc);
          cur.speed = effectiveSpeed;
          next[d.id] = cur;
          didChange = true;
          if (cur.progress >= 100) {
            window.electronAPI.completeDownload(d.id).then(refreshDownloads);
          }
        });
        return didChange ? next : prev;
      });
    }, 500);
    return () => clearInterval(id);
  }, [downloads, speedLimit, refreshDownloads]);

  // Auto-start queued ones (up to maxConcurrent)
  useEffect(() => {
    const activeCount = downloads.filter((d) => d.status === 'downloading').length;
    const queued = downloads.filter((d) => d.status === 'queued');
    const toStart = Math.max(0, maxConcurrent - activeCount);
    for (let i = 0; i < Math.min(toStart, queued.length); i++) {
      window.electronAPI.resumeDownload(queued[i].id).then(refreshDownloads);
    }
  }, [downloads.length, maxConcurrent]);

  const active = downloads.filter((d) => d.status === 'downloading' || d.status === 'paused');
  const queued = downloads.filter((d) => d.status === 'queued');
  const completed = downloads.filter((d) => d.status === 'completed');

  const handlePause = async (id) => {
    await window.electronAPI.pauseDownload(id);
    await refreshDownloads();
  };
  const handleResume = async (id) => {
    await window.electronAPI.resumeDownload(id);
    await refreshDownloads();
  };
  const handleCancel = async (id) => {
    await window.electronAPI.cancelDownload(id);
    await refreshDownloads();
  };

  const saveSpeedLimit = async (v) => {
    setSpeedLimit(v);
    await window.electronAPI.updateSettings(currentUser.id, { download_limit_mbps: v });
  };

  return (
    <div className="view-container">
      <h1 className="view-title">Загрузки</h1>

      <section className="mb-2">
        <h3 className="section-title">Текущие загрузки</h3>
        {active.length === 0 ? (
          <div className="empty-state">Нет активных загрузок</div>
        ) : (
          active.map((d) => {
            const p = progressMap[d.id] || { progress: d.progress || 0, speed: 0 };
            const remaining = p.speed > 0 ? ((100 - p.progress) / 100 * d.size_gb * 1024 / p.speed) : 0;
            return (
              <div key={d.id} className="p-2 mb-1" style={{ background: 'var(--bg-panel)', borderRadius: 4 }}>
                <div className="row mb-1">
                  <div
                    style={{
                      width: 60, height: 30,
                      background: `linear-gradient(135deg, ${d.cover_color}, ${d.cover_color2})`,
                      borderRadius: 2,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-highlight)' }}>{d.title}</div>
                    <div className="text-small text-secondary">
                      {d.status === 'paused' ? 'Пауза' : `${p.speed.toFixed(1)} MB/s`} • {p.progress.toFixed(1)}%
                      {d.status === 'downloading' && p.speed > 0 && (
                        ` • Осталось: ${Math.ceil(remaining)} сек.`
                      )}
                    </div>
                  </div>
                  {d.status === 'downloading' ? (
                    <button className="btn btn-secondary" onClick={() => handlePause(d.id)}>
                      <FaPause />
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={() => handleResume(d.id)}>
                      <FaPlay />
                    </button>
                  )}
                  <button className="btn btn-danger" onClick={() => handleCancel(d.id)}>
                    <FaTimes />
                  </button>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            );
          })
        )}
      </section>

      <section className="mb-2">
        <h3 className="section-title">Очередь</h3>
        {queued.length === 0 ? (
          <div className="empty-state">Очередь пуста</div>
        ) : (
          queued.map((d, i) => (
            <div key={d.id} className="row p-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div
                style={{
                  width: 60, height: 30,
                  background: `linear-gradient(135deg, ${d.cover_color}, ${d.cover_color2})`,
                  borderRadius: 2,
                }}
              />
              <div style={{ flex: 1 }}>{d.title}</div>
              <button className="btn btn-secondary"><FaArrowUp /></button>
              <button className="btn btn-secondary"><FaArrowDown /></button>
              <button className="btn btn-danger" onClick={() => handleCancel(d.id)}>
                <FaTimes />
              </button>
            </div>
          ))
        )}
      </section>

      <section className="mb-2">
        <h3 className="section-title">Завершённые</h3>
        {completed.length === 0 ? (
          <div className="empty-state">Нет завершённых</div>
        ) : (
          completed.map((d) => (
            <div key={d.id} className="row p-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div
                style={{
                  width: 60, height: 30,
                  background: `linear-gradient(135deg, ${d.cover_color}, ${d.cover_color2})`,
                  borderRadius: 2,
                }}
              />
              <div style={{ flex: 1 }}>
                <div>{d.title}</div>
                <div className="text-small text-secondary">
                  {new Date(d.added_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
              <button className="btn btn-green">Играть</button>
            </div>
          ))
        )}
      </section>

      <section>
        <h3 className="section-title">Настройки загрузки</h3>
        <div className="setting-row">
          <div className="setting-label">
            <strong>Ограничение скорости (MB/s)</strong>
            <small>0 = без ограничения</small>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={speedLimit}
            onChange={(e) => saveSpeedLimit(parseFloat(e.target.value))}
            style={{ width: 200 }}
          />
          <span style={{ minWidth: 50, textAlign: 'right' }}>
            {speedLimit === 0 ? 'Безлимит' : `${speedLimit} MB/s`}
          </span>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <strong>Одновременных загрузок</strong>
          </div>
          <select value={maxConcurrent} onChange={(e) => setMaxConcurrent(parseInt(e.target.value))}>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <strong>Скачивать только ночью</strong>
          </div>
          <div className={`toggle ${nightOnly ? 'on' : ''}`} onClick={() => setNightOnly(!nightOnly)} />
        </div>
      </section>
    </div>
  );
}
