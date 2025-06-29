/*
 * Copyright (C) 2021-2025 istallia
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/* --- ボタン読み込み待ち --- */
const main     = document.getElementById('root').firstChild;
const observer = new MutationObserver(mutations => {
	mutations.forEach(mutation => {
		if (mutation.addedNodes.length > 0) putCopyButton();
	});
});
observer.observe(main, {
	childList : true,
	subtree   : true
});


/* --- ボタンの配置 --- */
const putCopyButton = () => {
	/* 追加済み判定 */
	if (document.getElementById('ista-button-copy_liked_users')) return;
	/* 「いいね！したユーザー」のボタンの存在確認 */
	const svg_liked_candidates = Array.from(document.querySelectorAll('button.MuiButtonBase-root > span > svg[class]'));
	const filtered             = svg_liked_candidates.filter(svg => {
		const button = svg.parentNode.parentNode;
		const text   = button.innerText;
		return text.includes('いいね') || text.toLowerCase().includes('like');
	});
	if (filtered.length === 0) return;
	const svg_liked      = filtered[0];
	const button_liked   = svg_liked.parentNode.parentNode;
	const svg_span_liked = svg_liked.parentNode;
	const listDiv        = button_liked.parentNode;
	/* 要素を準備 */
	const button    = document.createElement('button');
	const span      = document.createElement('span');
	const svg       = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	const path      = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	const caption   = document.createElement('span');
	button.id       = 'ista-button-copy_liked_users';
	button.classList.add(... button_liked.classList);
	button.setAttribute('tab-index', '0');
	button.setAttribute('type', 'button');
	span.classList.add(... svg_span_liked.classList);
	svg.setAttribute('width', '24');
	svg.setAttribute('height', '24');
	svg.setAttribute('viewBox', '0 0 24 24');
	svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	svg.classList.add(... svg_liked.classList);
	path.setAttribute('d', 'M10 19h10v1h-10v-1zm14-13v18h-18v-6h-6v-18h18v6h6zm-18 0h10v-4h-14v14h4v-10zm16 2h-1.93c-.669 0-1.293.334-1.664.891l-1.406 2.109h-3.93l-1.406-2.109c-.371-.557-.995-.891-1.664-.891h-2v14h14v-14zm-12 6h10v-1h-10v1zm0 3h10v-1h-10v1z');
	caption.innerText = '「いいね！」したユーザーをコピー';
	button.addEventListener('click', copyLikedUsers);
	/* 要素を組み立て */
	svg.appendChild(path);
	span.appendChild(svg);
	button.appendChild(span);
	button.appendChild(caption);
	listDiv.appendChild(button);
	exist_button = true;
	/* (一応)ユーザリストやカウントをリセット */
	liked_users = [];
	retry_count = 0;
};


/* --- いいねユーザを取得、コピーする関数(トリガ) --- */
let liked_users = [];
let retry_count = 0;
const copyLikedUsers = page => {
	/* 引数チェック */
	if ((typeof page).toLowerCase() !== 'number') page = 1;
	/* プログレスバー表示 */
	createProgressbar(false);
	/* 動画のIDを取得 */
	let split_url = location.pathname.split('/');
	let video_id  = '';
	do {
		video_id = split_url.pop();
	} while (video_id.slice(0,2) !== 'sm' && split_url.length > 0);
	if (video_id.slice(0,2) !== 'sm' && split_url.length === 0) {
		window.alert('URLから動画IDを検出できませんでした。\n一度投稿動画一覧を表示してから、当該動画のアナリティクスを再表示してお試しください。');
		return null;
	}
	/* パラメータを準備して送信 */
	const params = {
		_frontendId      : 23,
		_frontendVersion : '1.0.0',
		from             : '2000-01-01',
		to               : '2100-01-01',
		sort             : 'premiumPriority',
		pageSize         : 20,
		page             : page
	};
	fetch('https://nvapi.nicovideo.jp/v2/users/me/videos/'+video_id+'/likes?'+encodeHTMLForm(params), {
		mode        : 'cors',
		credentials : 'include',
		cache       : 'no-cache'
	})
	.catch(err => {
		window.alert('サーバーに接続できませんでした。インターネット接続を確認してください。');
		console.log(err);
		return null;
	})
	.then(response => response.json())
	.then(json => {
		/* エラーチェック */
		if (json.meta.status !== 200) {
			if (retry_count < 4) {
				retry_count++;
				setTimeout(copyLikedUsers, 3000, page);
			} else {
				window.alert('ユーザーの取得に失敗しました。間を空けて再試行してください。');
			}
			return null;
		}
		/* いいねユーザリストに取得したユーザを追加 */
		json.data.items.forEach(friend => {
			liked_users.push({
				name : friend.user.nickname,
				time : Date.parse(friend.like.likedAt)
			});
		});
		/* プログレスバーを更新 */
		updateProgressbar(page, Math.ceil(json.data.summary.totalCount/20));
		/* 続きがあれば次のリクエストへ(再帰) */
		if (json.data.summary.hasNext) {
			setTimeout(copyLikedUsers, 0, page+1);
		} else {
			setTimeout(() => {
				/* ソート選択 */
				const exe_sort = window.confirm('「いいね！」ユーザーは、標準ではプレミアム会員を優先した日時順にソートされています。\nプレミアム会員かどうかを無視した通常の日時順にソートし直しますか？');
				if (exe_sort) liked_users = sortByTime(liked_users);
				/* コピー */
				liked_users = liked_users.map(data => data.name);
				navigator.clipboard.writeText(liked_users.join('\n'));
				window.alert(String(liked_users.length)+'件のユーザー名をコピーしました。');
				document.getElementById('ista-communication').classList.remove('visible');
				liked_users = [];
				retry_count = 0;
			}, 400);
		}
	});
};


/* --- フッタを作成 --- */
const createProgressbar = is_reset => {
	/* 要素があれば表示する */
	const footer = document.getElementById('ista-communication');
	if (footer) {
		if (is_reset) footer.querySelector('div.ista-communication-progress').firstChild.style.width = '0px';
		footer.querySelector('div.ista-communication-progress').setAttribute('max', 10);
		footer.classList.add('visible');
		return;
	}
	/* 要素を生成 */
	const parent   = document.createElement('div');
	const text     = document.createElement('div');
	const progress = document.createElement('div');
	const current  = document.createElement('div');
	parent.id      = 'ista-communication';
	parent.classList.add('ista-communication', 'visible');
	text.classList.add('ista-communication-text');
	text.innerText = '通信中です……';
	progress.classList.add('ista-communication-progress');
	progress.setAttribute('max', 10);
	/* 要素を追加 */
	progress.appendChild(current);
	parent.appendChild(text);
	parent.appendChild(progress);
	document.body.appendChild(parent);
};


/* --- プログレスバーを更新 --- */
const updateProgressbar = (current_value = 0, max_value = null) => {
	/* 要素を取得 */
	const footer   = document.getElementById('ista-communication');
	const progress = footer.querySelector('div.ista-communication-progress');
	const current  = progress.firstChild;
	if (max_value) {
		progress.setAttribute('max', max_value);
	} else {
		max_value = Number(progress.getAttribute('max'));
	}
	/* 進捗率を計算 */
	const per           = Math.round(current_value * 100 / max_value);
	current.style.width = String(per) + 'vw';
};


/* --- 日時(time)でソート --- */
const sortByTime = list => {
	list.sort((a, b) => {
		if (a.time > b.time) return -1;
		if (a.time < b.time) return 1;
		return 0;
	});
	return list;
};


/* --- 連想配列形式のパラメータをHTML Form形式に変換する関数 --- */
const encodeHTMLForm = data => {
	const params = [];
	for(let name in data) {
		const value = data[name];
		const param = encodeURIComponent(name) + '=' + encodeURIComponent(value);
		params.push(param);
	}
	return params.join('&').replace(/%20/g, '+');
}


/* --- 読み込み時にボタン配置を行う --- */
putCopyButton();
