import React, { useState, useCallback, useEffect } from 'react';
import './App.css';

const API_URL = 'https://passwordgeneration.onrender.com/generate';

async function fetchPassword(
  length: number,
  useChars: boolean,
  useMixed: boolean,
  useDigits: boolean,
  useSymbols: boolean
): Promise<string> {
  const params = new URLSearchParams({
    length: String(length),
    use_lower: String(useChars),
    use_upper: String(useMixed),
    use_digits: String(useDigits),
    use_symbols: String(useSymbols),
  });
  const res = await fetch(`${API_URL}?${params}`);
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  const data = await res.json();
  // レスポンスが { password: "..." } 形式を想定。文字列の場合はそのまま返す
  return typeof data === 'string' ? data : data.password ?? JSON.stringify(data);
}

// ページ下部に追加したいリンクはここに追記していく
const FOOTER_LINKS: { label: string; url: string }[] = [
  { label: 'ナストンのまとめ(技術ブログ)', url: 'https://nasuton.net/blog/' },
  { label: 'About Me', url: 'https://nasuton.github.io/' },
  { label: 'フロントエンドのソースコード', url: 'https://github.com/nasuton/PasswordGeneration' },
  { label: 'バックエンドのソースコード', url: 'https://github.com/nasuton/PasswordGeneration_API' }
];

function App() {
  const [length, setLength] = useState(16);
  const [useChars, setUseChars] = useState(true);
  const [useMixed, setUseMixed] = useState(true);
  const [useDigits, setUseDigits] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // タブを閉じる・ページ移動時に確認ダイアログを表示
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const regenerate = useCallback(
    async (len: number, chars: boolean, mixed: boolean, digits: boolean, symbols: boolean) => {
      setLoading(true);
      setError(null);
      setCopied(false);
      try {
        const pw = await fetchPassword(len, chars, mixed, digits, symbols);
        setPassword(pw);
      } catch (e) {
        setError('パスワードの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 「文字」は他が全て外れるときは強制チェック
  const isCharsLocked = !useMixed && !useDigits && !useSymbols;

  const handleLength = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setLength(v);
  };

  const handleLengthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      setLength(0);
      return;
    }
    const v = Number(raw);
    if (isNaN(v)) return;
    const clamped = Math.min(128, Math.max(5, v));
    setLength(clamped);
  };

  const handleLengthInputBlur = () => {
    if (length < 5 || length === 0) {
      setLength(5);
    }
  };

  const handleChars = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCharsLocked) return;
    const nextChars = e.target.checked;
    const nextMixed = nextChars ? useMixed : false;
    setUseChars(nextChars);
    setUseMixed(nextMixed);
  };

  const handleMixed = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextMixed = e.target.checked;
    const nextChars = nextMixed ? true : (!useDigits && !useSymbols);
    setUseMixed(nextMixed);
    setUseChars(nextChars);
  };

  const handleDigits = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextDigits = e.target.checked;
    const nextChars = useChars || (!useMixed && !nextDigits && !useSymbols);
    setUseDigits(nextDigits);
    setUseChars(nextChars);
  };

  const handleSymbols = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextSymbols = e.target.checked;
    const nextChars = useChars || (!useMixed && !useDigits && !nextSymbols);
    setUseSymbols(nextSymbols);
    setUseChars(nextChars);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="pg-container">
      <h1 className="pg-title">パスワード生成</h1>
      <p className="pg-notice">※使用している環境の仕様によりパスワード生成に20秒～30秒程かかる場合があります</p>

      {/* パスワード表示 + コピーボタン */}
      <div className="pg-password-row">
        <input
          className="pg-password-box"
          type="text"
          value={loading ? '生成中...' : (error ?? password)}
          readOnly
        />
        <button className="pg-copy-btn" onClick={handleCopy} disabled={loading || !!error}>
          {copied ? 'コピー済み！' : 'コピー'}
        </button>
      </div>

      {error && <p className="pg-error">{error}</p>}

      {/* 長さスライダー */}
      <div className="pg-section">
        <div className="pg-length-row">
          <label className="pg-label">長さ:</label>
          <input
            className="pg-length-input"
            type="number"
            min={5}
            max={128}
            value={length === 0 ? '' : length}
            onChange={handleLengthInput}
            onBlur={handleLengthInputBlur}
            disabled={loading}
          />
        </div>
        <input
          className="pg-slider"
          type="range"
          min={5}
          max={128}
          value={length || 5}
          onChange={handleLength}
          disabled={loading}
        />
        <div className="pg-slider-minmax">
          <span>5</span>
          <span>128</span>
        </div>
      </div>

      {/* チェックボックス */}
      <div className="pg-section">
        <label className={`pg-checkbox-label${isCharsLocked ? ' pg-checkbox-locked' : ''}`}>
          <input
            type="checkbox"
            checked={useChars}
            onChange={handleChars}
            disabled={isCharsLocked || loading}
          />
          文字
          {isCharsLocked && <span className="pg-lock-note">（常に必須）</span>}
        </label>
        <label className="pg-checkbox-label">
          <input type="checkbox" checked={useMixed} onChange={handleMixed} disabled={loading} />
          大文字と小文字の混在
        </label>
        <label className="pg-checkbox-label">
          <input type="checkbox" checked={useDigits} onChange={handleDigits} disabled={loading} />
          数字
        </label>
        <label className="pg-checkbox-label">
          <input type="checkbox" checked={useSymbols} onChange={handleSymbols} disabled={loading} />
          区切り文字
        </label>
      </div>

      {/* 再生成ボタン */}
      <button
          className="pg-regenerate-btn"
          onClick={() => regenerate(length, useChars, useMixed, useDigits, useSymbols)}
          disabled={loading}
      >
        {loading ? '生成中...' : '再生成'}
      </button>

      {/* サービス説明 */}
      <div className="pg-description">
        <p className="pg-description-lead">
          複雑で安全なパスワードをワンクリックで自動生成
        </p>
        <p className="pg-description-body">
          文字数（5〜128文字）を指定し、「数値」「大文字」「小文字」「記号」の組み合わせ条件をスイッチで手軽に選ぶだけで、辞書攻撃に強い強固でランダムなパスワードを一瞬で生成します
        </p>
        <p className="pg-description-body">
          <span className="pg-description-heading">■ 完全ローカル処理で安心のセキュリティ</span><br />
          当サイトのオンラインサーバーに生成したパスワード情報が送信・保存されることは一切ないため、安心して各種アカウントのパスワード作成にお役立ていただけます
        </p>
      </div>

      {/* 技術スタック説明 */}
      <p className="pg-stack-note">
        フロントエンドには React + GitHub Pages を使用<br />
        バックエンドは Go言語 gin フレームワーク +{' '}
        <a
          className="pg-stack-link"
          href="https://render.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          render.com
        </a>{' '}
        を使用
      </p>

      {/* フッターリンク（FOOTER_LINKS に追記するだけで増やせる） */}
      {FOOTER_LINKS.length > 0 && (
        <footer className="pg-footer">
          <span className="pg-footer-title">各種リンク</span>
          <div className="pg-footer-links">
            {FOOTER_LINKS.map((link, index) => (
              <React.Fragment key={link.url}>
                {index > 0 && <span className="pg-footer-sep">/</span>}
                <a
                  className="pg-footer-link"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>
              </React.Fragment>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
