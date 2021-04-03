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
};
putCopyButton();


/* --- いいねユーザを取得、コピーする関数 --- */
const copyLikedUsers = () => {
	/* 通信を準備 */
	let video_id = location.pathname.split('/');
	video_id     = video_id[video_id.length-1];
	const params = {
		_frontendId      : 23,
		_frontendVersion : '1.0.0',
		term             : 'halfYear',
		sort             : 'premiumPriority',
		pageSize         : 65535,
		page             : 1
	};
	const xhr = new XMLHttpRequest();
	xhr.open('GET', 'https://nvapi.nicovideo.jp/v2/users/me/videos/'+video_id+'/likes?'+encodeHTMLForm(params));
	xhr.responseType    = 'json';
	xhr.withCredentials = true;
	xhr.setRequestHeader('Cache-Control', 'no-cache');
	/* 受信イベントを用意 */
	const eventHandler = () => {
		console.log(xhr.response);
	};
	/* 送信 */
	xhr.send();
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
