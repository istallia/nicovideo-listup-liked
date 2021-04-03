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
	const button_liked = document.querySelector('div > ul > li > button');
	if (!button_liked) return;
	const ul = button_liked.parentNode.parentNode;
	/* 要素を準備 */
	const li      = document.createElement('li');
	const button  = document.createElement('button');
	const span    = document.createElement('span');
	const div     = document.createElement('div');
	const svg     = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	const path    = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	const caption = document.createElement('span');
	button.id     = 'ista-button-copy_liked_users';
	button.classList.add('MuiButtonBase-root', 'MuiButton-root', 'MuiButton-text', 'css-19krv40');
	button.setAttribute('tab-index', '0');
	button.setAttribute('type', 'button');
	span.classList.add('MuiButton-label');
	div.classList.add('css-1ch9zvf');
	svg.setAttribute('width', '24');
	svg.setAttribute('height', '24');
	svg.setAttribute('viewBox', '0 0 24 24');
	svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	path.setAttribute('d', 'M10 19h10v1h-10v-1zm14-13v18h-18v-6h-6v-18h18v6h6zm-18 0h10v-4h-14v14h4v-10zm16 2h-1.93c-.669 0-1.293.334-1.664.891l-1.406 2.109h-3.93l-1.406-2.109c-.371-.557-.995-.891-1.664-.891h-2v14h14v-14zm-12 6h10v-1h-10v1zm0 3h10v-1h-10v1z');
	caption.innerText = '「いいね！」したユーザーをコピー';
	button.addEventListener('click', copyLikedUsers);
	/* 要素を組み立て */
	svg.appendChild(path);
	div.appendChild(svg);
	span.appendChild(div);
	span.appendChild(caption);
	button.appendChild(span);
	li.appendChild(button);
	ul.appendChild(li);
	exist_button = true;
	/* (一応)ユーザリストやカウントをリセット */
	liked_users = [];
	retry_count = 0;
};


/* --- いいねユーザを取得、コピーする関数(トリガ) --- */
let liked_users = [];
let retry_count = 0;
const copyLikedUsers = page => {
	if ((typeof page).toLowerCase() !== 'number') page = 1;
	/* 動画のIDを取得 */
	let video_id = location.pathname.split('/');
	video_id     = video_id[video_id.length-1];
	/* パラメータを準備して送信 */
	const params = {
		_frontendId      : 23,
		_frontendVersion : '1.0.0',
		term             : 'halfYear',
		sort             : 'premiumPriority',
		pageSize         : 20,
		page             : page
	};
	fetch('https://nvapi.nicovideo.jp/v2/users/me/videos/'+video_id+'/likes?'+encodeHTMLForm(params), {
		mode        : 'cors',
		credentials : 'include',
		cache       : 'no-cache'
	})
	.catch(err => window.alert('サーバーに接続できませんでした。インターネット接続を確認してください。'))
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
			return;
		}
		/* いいねユーザリストに取得したユーザを追加 */
		json.data.items.forEach(friend => {
			liked_users.push({
				name : friend.user.nickname,
				time : Date.parse(friend.like.likedAt)
			});
		});
		/* 続きがあれば次のリクエストへ(再帰) */
		if (json.data.summary.hasNext) {
			copyLikedUsers(page+1);
		} else {
			/* ソート選択 */
			const exe_sort = window.confirm('「いいね！」ユーザーは、標準ではプレミアム会員を優先した日時順にソートされています。\nプレミアム会員かどうかを無視した通常の日時順にソートし直しますか？');
			if (exe_sort) liked_users = sortByTime(liked_users);
			/* コピー */
			liked_users = liked_users.map(data => data.name);
			navigator.clipboard.writeText(liked_users.join('\n'));
			window.alert(String(liked_users.length)+'件のユーザー名をコピーしました。');
			liked_users = [];
			retry_count = 0;
		}
	});
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
