import { useState } from 'react';
import { Download, Upload, FileJson, FileArchive, Globe } from 'lucide-react';
import { useDocumentStore } from '../../store/document';
import { useParams } from 'react-router-dom';
import { api } from '../../store/auth';

export default function ProjectPanel() {
  const document_ = useDocumentStore((s) => s.document);
  const setDocument = useDocumentStore((s) => s.setDocument);
  const replaceDocument = useDocumentStore((s) => s.replaceDocument);
  const { projectId } = useParams();

  function exportJSON() {
    const blob = new Blob([JSON.stringify(document_, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lightglass-${document_.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportZIP() {
    // 简化: 仅导出 JSON + 说明, 真正的 ZIP 需要 jszip
    const meta = {
      type: 'lightglass.project',
      version: 1,
      exportedAt: new Date().toISOString(),
      document: document_,
    };
    const blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lightglass-project.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data.document) replaceDocument(data.document);
        else if (Array.isArray(data)) {
          useDocumentStore.getState().importWindows(data);
        } else if (data.version) {
          replaceDocument(data);
        }
      } catch (err) {
        alert('JSON 解析失败');
      }
    };
    reader.readAsText(file);
  }

  async function publish() {
    const res = await api(`/api/projects/${projectId}/snapshots`, {
      method: 'POST',
      body: JSON.stringify({ document: document_ }),
    });
    alert('已发布 (v' + (res as any).snapshot.version + ')');
  }

  function copyViewerURL() {
    const url = `${location.protocol}//${location.hostname}:5174/?id=${projectId}`;
    navigator.clipboard.writeText(url);
    alert('已复制访问端地址: ' + url);
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="glass rounded-xl p-3">
        <div className="label mb-2">分享</div>
        <button className="btn w-full" onClick={copyViewerURL}>
          <Globe className="h-4 w-4" /> 复制访问端地址
        </button>
      </div>

      <div className="glass rounded-xl p-3">
        <div className="label mb-2">发布</div>
        <button className="btn btn-primary w-full" onClick={publish}>
          <Globe className="h-4 w-4" /> 发布当前快照
        </button>
      </div>

      <div className="glass rounded-xl p-3">
        <div className="label mb-2">导入 / 导出</div>
        <div className="space-y-2">
          <button className="btn w-full" onClick={exportJSON}>
            <FileJson className="h-4 w-4" /> 导出 JSON
          </button>
          <button className="btn w-full" onClick={exportZIP}>
            <FileArchive className="h-4 w-4" /> 导出项目包
          </button>
          <label className="btn w-full cursor-pointer">
            <Upload className="h-4 w-4" /> 导入 JSON
            <input type="file" accept="application/json" className="hidden" onChange={importJSON} />
          </label>
        </div>
      </div>

      <div className="glass rounded-xl p-3 text-[11px] text-ink-300">
        <div className="label mb-1">快捷键</div>
        <ul className="space-y-1">
          <li><kbd>⌘Z</kbd> 撤销 · <kbd>⌘⇧Z</kbd> 重做</li>
          <li><kbd>⌘C</kbd> 复制 · <kbd>⌘V</kbd> 粘贴 · <kbd>⌘D</kbd> 副本</li>
          <li><kbd>Del</kbd> 删除 · <kbd>Esc</kbd> 取消选择</li>
          <li>拖动标题栏移动 · 边角调整尺寸</li>
        </ul>
      </div>
    </div>
  );
}
