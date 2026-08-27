# FE Lab Research 페이지 추가 가이드

이 파일 묶음은 현재 `FELAB-UNIST.github.io` 저장소의 정적 페이지 구조에
맞춰져 있습니다. React, npm 또는 별도의 빌드 과정은 필요하지 않습니다.

## 추가할 파일 4개

아래 파일을 저장소의 같은 상대 경로에 그대로 추가합니다.

| 제공 파일 | 저장소에 추가할 위치 | 역할 |
| --- | --- | --- |
| `pages/research.html` | `pages/research.html` | 연구 페이지의 HTML 본문 |
| `css/research.css` | `css/research.css` | 연구 페이지 전용 스타일과 반응형 레이아웃 |
| `js/modules/research.js` | `js/modules/research.js` | 연구 내용 렌더링 및 coauthor network |
| `data/research-config.json` | `data/research-config.json` | 연구 분류, 대표 논문, 저자 소속과 그룹 설정 |

기존 `data/publications.json`은 복사하거나 수정할 필요가 없습니다. 연구
페이지의 coauthor network가 이 파일을 직접 읽습니다.

## 수정할 기존 파일 3개

### 1. `index.html`

기존 `styles.css` 바로 다음 줄에 연구 페이지 CSS를 추가합니다.

```html
<link rel="stylesheet" href="./css/styles.css">
<link rel="stylesheet" href="./css/research.css">
```

`./js/app.js`보다 먼저 연구 페이지 JavaScript를 불러옵니다.

```html
<script src="./js/modules/activities.js"></script>
<script src="./js/modules/research.js"></script>
<script src="./js/app.js"></script>
```

### 2. `components/header.html`

데스크톱 메뉴의 Publications와 Projects 사이에 다음 링크를 추가합니다.

```html
<a href="#" data-tab="research" class="nav-link text-sm font-medium text-gray-600 hover:text-brand-navy transition-colors">Research</a>
```

같은 파일의 모바일 메뉴에도 다음 링크를 추가합니다.

```html
<a href="#" data-tab="research" class="nav-link block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-brand-navy hover:bg-gray-50">Research</a>
```

`components/drawer.html`은 수정하지 않습니다. 해당 파일은 모바일 메뉴가
아니라 논문·프로필 상세정보용 drawer입니다.

### 3. `js/app.js`

`loadPage()` 안의 `titles` 객체에 다음 항목을 추가합니다.

```js
'publications': 'Publications',
'research': 'Research',
'projects': 'Research Projects',
```

`initializePage(page)`의 `switch` 문에는 다음 case를 추가합니다.

```js
case 'research':
    if (typeof ResearchManager !== 'undefined') {
        ResearchManager.init();
    }
    break;
```

별도의 route map은 필요하지 않습니다. 기존 코드가 자동으로
`./pages/${page}.html`을 불러오므로 Research 탭은 `pages/research.html`로
연결됩니다.

## 가장 간단한 적용 방법

1. 파일 묶음의 `pages`, `css`, `js`, `data` 폴더를 저장소 루트에 덮어
   넣습니다. 이 묶음에는 기존 파일과 같은 이름이 없으므로 기존 파일은
   덮어쓰지 않습니다.
2. `integration.patch`를 저장소 루트에 놓습니다.
3. 다음 명령을 실행합니다.

```bash
git apply --check integration.patch
git apply integration.patch
```

4. 로컬 서버에서 `#research`를 확인한 뒤 변경 사항을 commit하고 push합니다.

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000/#research`를 엽니다. `index.html`을 파일로
직접 여는 방식은 `fetch()` 제한 때문에 동작하지 않을 수 있으므로 간단한
로컬 서버를 사용하는 것이 좋습니다.

## 게시 후 주소

```text
https://felab-unist.github.io/#research
```

`/pages/research.html`로 직접 링크하지 않는 것이 좋습니다. 이 파일은 공통
header와 footer가 없는 HTML fragment이며, 루트 페이지의 router 안에서
사용하도록 만들어졌습니다.

## 이후 업데이트 방법

- 전체 publication 추가·수정: 기존 `data/publications.json`
- 연구 분야 설명과 대표 논문: `data/research-config.json`의 `themes`
- 리뷰 논문: `data/research-config.json`의 `reviews`
- 저자 소속: `data/research-config.json`의 `affiliations`
- Alumni, LinqAlpha, 외부 저자 구분: `authorGroups`
- 자동 분류가 맞지 않는 논문: `classificationOverrides`

Coauthor network에는 working paper가 제외되며, 두 편 이상에 참여한 저자만
나타납니다. 저자를 클릭했을 때 표시되는 논문 제목은 최대 5편입니다.
