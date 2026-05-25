import React, { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FaPause, FaPlay, FaTimes } from 'react-icons/fa';

export default function DownloadsView() {
  const downloads = useAppStore(s => s.downloads);
  const refreshDownloads = useAppStore(s => s.refreshDownloads);
  const downloadProgress = useAppStore(s => s.downloadProgress);
  const updateDownload = useAppStore(s => s.updateDownload);
  const settings = useAppStore(s => s.settings);
  const currentUser = useAppStore(s => s.currentUser);

  useEffect(() => {
    refreshDownloads();
    const interval = setInterval(async () => {
      const active = useAppStore.getState().downloads.filter(d => d.status === 'downloading');
      for (const d of active) {
        const current = useAppStore.getState().downloadProgress[d.id] || { progress: d.progress || 0, speed: 0 };
        const limit = settings?.download_limit_mbps || 100;
        const baseSpeed = Math.min(limit || 100, 60);
        const speed = Math.max(5, baseSpeed + (Math.random() - 0.5) * 20);
        const totalBytes = (d.size_gb || 1) * 1024;
        const incMB = speed * 0.5;
        const incPct = (incMB / totalBytes) * 100;
        let newProgress = current.progress + incPct;
        if (newProgress >= 100) {
          newProgress = 100;
          await window.electronAPI.updateDownload(d.id, { status: 'completed', progress: 100 });
          await refreshDownloads();
        } else {
          updateDownload(d.id, { progress: newProgress, speed });
          await window.electronAPI.updateDownload(d.id, { progress: newProgress, speed_mbps: speed });
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const active = downloads.filter(d => d.status === 'downloading' || d.status === 'paused');
  const queued = downloads.filter(d => d.status === 'queued');
  const completed = downloads.filter(d => d.status === 'completed');

  const renderRow = (d) => {
    const local = downloadProgress[d.id] || {};
    const progress = local.progress != null ? local.progress : (d.progress || 0);
    const speed = local.speed != null ? local.speed : (d.speed_mbps || 0);
    const remainingMB = Math.max(0, (d.size_gb || 1) * 1024 * (100 - progress) / 100);
    const eta = speed > 0 ? Math.round(remainingMB / speed) : 0;
    return (
      <div key={d.id} className="download-row">
        <div className="download-cover" style={{ background: `linear-gradient(135deg, ${d.cover_color}, ${d.cover_color2})` }}></div>
        <div className="download-info">
          <div className="text-highlight" style={{ fontWeight: 600 }}>{d.title}</div>
          <div className="text-secondary" style={{ fontSize: 12, marginBottom: 4 }}>
            {d.status === 'paused' ? '⏸ Пауза' : `${progress.toFixed(1)}% • ${speed.toFixed(1)} МБ/с • осталось ${eta}с`}
          </div>
          <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${progress}%` }}></div></div>
        </div>
        <div className="download-actions">
          {d.status === 'downloading' ? (
            <button className="btn sm" onClick={async () => { await window.electronAPI.pauseDownload(d.id); refreshDownloads(); }}><FaPause /></button>
          ) : (
            <button className="btn sm" onClick={async () => { await window.electronAPI.resumeDownload(d.id); refreshDownloads(); }}><FaPlay /></button>
          )}
          <button className="btn sm danger" onClick={async () => { await window.electronAPI.cancelDownload(d.id); refreshDownloads(); }}><FaTimes /></button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">📥 Загрузки</div>
      </div>

      <h3 className="text-highlight mb-2">Сейчас загружается</h3>
      {active.length === 0 ? <div className="text-secondary mb-4">Нет активных загрузок</div> : active.map(renderRow)}

      {queued.length > 0 && <>
        <h3 className="text-highlight mb-2 mt-4">В очереди</h3>
        {queued.map(renderRow)}
      </>}

      {completed.length > 0 && <>
        <h3 className="text-highlight mb-2 mt-4">Завершено</h3>
        {completed.map(d => (
          <div key={d.id} className="download-row">
            <div className="download-cover" style={{ background: `linear-gradient(135deg, ${d.cover_color}, ${d.cover_color2})` }}></div>
            <div className="download-info">
              <div className="text-highlight" style={{ fontWeight: 600 }}>{d.title}</div>
              <div className="text-secondary" style={{ fontSize: 12 }}>✓ Установлено • {new Date(d.added_at).toLocaleDateString('ru-RU')}</div>
            </div>
            <button className="btn green sm">Играть</button>
          </div>
        ))}
      </>}

      <div className="card mt-4">
        <h3 className="text-highlight mb-3">⚙️ Настройки загрузки</h3>
        <div className="setting-row">
          <div>
            <div className="setting-label">Ограничение скорости</div>
            <div className="setting-desc">0 = безлимит</div>
          </div>
          <input
            type="range" min="0" max="100"
            value={settings?.download_limit_mbps || 0}
            onChange={async (e) => {
              await window.electronAPI.updateSettings(currentUser.id, { download_limit_mbps: Number(e.target.value) });
              const s = await window.electronAPI.getSettings(currentUser.id);
              useAppStore.getState().applySettings(s);
            }}
          /> <span>{settings?.download_limit_mbps || 0} МБ/с</span>
        </div>
      </div>
    </div>
  );
}
