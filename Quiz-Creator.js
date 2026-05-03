// #region 画面移動・ページ移動
//pageを切り替える
function navigate(pageId, direciton="forward"){
    showPageOnly(pageId, direciton);
    // URLを変える
    history.pushState({page: pageId}, "", `/${pageId}`);
}

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault(); //ページ更新を止める
        const targetId = link.dataset.target; //切り替えるページを取得

        if(targetId == "home"){
            navigate(targetId, "back");
            renderQuizList();
        } else {
            navigate(targetId);
        }
    })
})

//ブラウザの戻る・進むボタンで画面を切り替える
window.addEventListener("popstate", (e) => {
    // 1. URLの最後を取得(/page -> page)
    let pageId = location.pathname.split("/").pop();
    // 2. もし空（トップページ）なら "home" にする
    if(!pageId || pageId == "index.html") {
        pageId = "home";
    }
    // 3. 画面を切り替える（URLはもう変わっているので、表示だけ変える）
    showPageOnly(pageId, "back");
})

//画面を切り替える
function showPageOnly(pageId, direction="forward") {
    const currentPage = document.querySelector(".page.active");
    const nextPage = document.getElementById(pageId);

    if (!nextPage || currentPage === nextPage) return;

    // 1. これから表示するページ(nextPage)のアニメーションを一時的にオフにする
    nextPage.classList.add("no-animation");
    
    // 2. 表示するページを「右側(100%)」にセットする
    if(direction == "forward"){
        nextPage.classList.remove("left");
        nextPage.classList.add("right"); 
    } else {
        nextPage.classList.remove("right");
        nextPage.classList.add("left"); 
    }

    // 3. ブラウザに「配置が終わったよ」と認識させるためのわずかな待ち時間
    setTimeout(() => {
        // 4. アニメーションを復活させる
        nextPage.classList.remove("no-animation");

        // 5. スライド開始！
        if (currentPage) {
            currentPage.classList.remove("active")
            if(direction == "forward"){
                currentPage.classList.add("left");
            } else {
                currentPage.classList.add("right");
            }
        }

        nextPage.classList.remove("left", "right");
        nextPage.classList.add("active");
    }, 10); // 10ミリ秒（一瞬）待つのがコツです
}

// #endregion
//-------------------------------------------------
// #region クイズ作成フォーム
const addQuizBtn = document.getElementById("add-quiz-btn")
addQuizBtn.addEventListener("click", () => {
    const container = document.getElementById("quiz-container");

    const currentCount = container.querySelectorAll(".quiz-form-item").length + 1;
    // 問題数が100超えたら "add-quiz-btnボタン" を非表示
    if(currentCount >= 100) {
        addQuizBtn.classList.add("is-invisible");
    } else {
        if(addQuizBtn.classList.contains("is-invisible")) addQuizBtn.classList.remove("is-invisible");
    }

    const newForm = document.createElement("div");
    newForm.dataset.id = currentCount;
    newForm.classList.add("quiz-form-item");
    newForm.innerHTML = `
        <button class="remove-btn" onclick="deleteAndRenumber(this)">削除</button>
        <hr>
        <p>問題 ${currentCount}</p>
        <h3>問題文を入力</h3>
        <input type="text" id="quiz-question" placeholder="問題文を入力">
        <h3>選択肢を入力</h3>
        <div class="options-container">
            <div class="options-item">
                <input type="radio" name="correct-${currentCount}" value="0" checked>
                <input type="text" class="option-text" placeholder="選択肢 1">
                <button class="remove-option-btn" onclick="deleteOption(this)">削除</button>
            </div>
            <div class="options-item">
                <input type="radio" name="correct-${currentCount}" value="1">
                <input type="text" class="option-text" placeholder="選択肢 2">
                <button class="remove-option-btn" onclick="deleteOption(this)">削除</button>
            </div>
        </div>
        <button class="add-option-btn">＋ 選択肢を追加</button>
    `;

    container.appendChild(newForm);
    // 下にスクロールする
    (!addQuizBtn.classList.contains("is-invisible") ? addQuizBtn : saveAllBtn).scrollIntoView({behavior: 'smooth'});
});

// 選択肢の判別
document.getElementById("quiz-container").addEventListener("click", (e) => {
    if(e.target.classList.contains("add-option-btn")){
        const parentForm = e.target.closest(".quiz-form-item");
        const questionId = parentForm.dataset.id || 1; //今何問目か
        
        // 問題の中の選択肢を取得
        const optionContainer = parentForm.querySelector(".options-container");
        addOptionField(optionContainer, questionId);
    }
})

// 選択肢の追加
function addOptionField(container, questionId){
    const optionCount = container.querySelectorAll(".options-item").length;
    if(optionCount >= 5) return;

    const newOption = document.createElement("div");
    newOption.classList.add("options-item");
    newOption.innerHTML = `
        <input type="radio" name="correct-${questionId}" value="${optionCount}">
        <input type="text" class="option-text" placeholder="選択肢 ${optionCount + 1}">
        <button class="remove-option-btn" onclick="deleteOption(this)"></button>
    `;

    container.appendChild(newOption);
}

// 問題番号更新
function updateQuestionNumbers() {
    const items = document.querySelectorAll(".quiz-form-item");
    
    items.forEach((item, index) => {
        const newNumber = index + 1;
        
        // 1. 問題番号の更新
        const pTag = item.querySelector("p");
        if (pTag) pTag.textContent = `問題 ${newNumber}`;
        
        // 2. ラジオボタンのグループ名を更新
        const radios = item.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            radio.name = `correct-${newNumber}`;
        });
        
        item.dataset.id = newNumber;

        // 3. その問題(item)の中の選択肢をすべて取得
        const options = item.querySelectorAll(".options-item"); // itemから探す

        options.forEach((option, oIndex) => {
            const newOptionNum = oIndex + 1;

            const input = option.querySelector(".option-text");
            if (input) {
                input.placeholder = `選択肢 ${newOptionNum}`;
            }
        });
    });
}
// 問題の削除
function deleteAndRenumber(btn) {
    // 削除対象の要素を取得
    const target = btn.closest('.quiz-form-item');
    
    // 削除を実行
    target.remove();
    
    // 番号の振り直し
    updateQuestionNumbers();
}

// 選択肢の削除
function deleteOption(btn) {
    const optionToDelete = btn.closest('.options-item');
    const container = optionToDelete.closest('.options-container');
    
    // 現在の全選択肢を取得
    const options = container.querySelectorAll('.options-item');

    // 2個以下なら削除しない
    if (options.length <= 2) {
        alert("選択肢は最低2つ必要です！");
        return;
    }

    // 消すやつがチェックされているか保持
    const wasChecked = optionToDelete.querySelector('input[type="radio"]').checked;

    // 消す要素「以外」の最初の要素をあらかじめ選んでおく
    let fallbackOption = null;
    for (let opt of options) {
        if (opt !== optionToDelete) {
            fallbackOption = opt;
            break; 
        }
    }

    // 削除実行
    optionToDelete.remove();

    // チェックされていた場合、用意しておいた fallbackOption にチェックを入れる
    if (wasChecked && fallbackOption) {
        const radio = fallbackOption.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
    }

    // 番号の振り直し
    updateQuestionNumbers();
}

// 選択肢のコンテナ（親）に対してイベントを設定
const container = document.getElementById("quiz-container");

// マウスが乗った時（mouseenterの代わり）
container.addEventListener("mouseover", (e) => {
    const item = e.target.closest(".options-item");
    if (!item) return;

    const btn = item.querySelector(".remove-option-btn");
    const allOptions = item.closest(".options-container").querySelectorAll(".options-item");

    // 選択肢が3つ以上ある時だけ表示クラスをつける
    if (allOptions.length > 2) {
        btn.classList.add("is-visible");
    }
});

// マウスが離れた時
container.addEventListener("mouseout", (e) => {
    const item = e.target.closest(".options-item");
    if (item) {
        const btn = item.querySelector(".remove-option-btn");
        btn.classList.remove("is-visible");
    }
});

// 問題保存
const saveAllBtn = document.getElementById("save-all-btn")
saveAllBtn.addEventListener("click", () => {
    let hasError = false; //エラーがあるか

    const quizData = [];
    const quizNameInput = document.getElementById("quiz-name");
    if(!quizNameInput.value.trim()){
        quizNameInput.classList.add("input-error"); // 赤くする
        hasError = true;
    } else {
        quizNameInput.classList.remove("input-error");
    }
    quizData.push(quizNameInput.value);
    const forms = document.querySelectorAll(".quiz-form-item");

    //空白の所がないか、全ての問題をチェック
    for(let i = 0; i < forms.length; i++){
        const form = forms[i];
        const questionInput = form.querySelector("#quiz-question");

        //問題文をチェック
        if(!questionInput.value.trim()){
            questionInput.classList.add("input-error"); // 赤くする
            hasError = true;
        } else {
            questionInput.classList.remove("input-error");
        }

        //選択肢をチェック
        const optionInputs = form.querySelectorAll(".option-text");
        for(let j = 0; j < optionInputs.length; j++){
            const input = optionInputs[j];
            if(!input.value.trim()){
                input.classList.add("input-error"); // 赤くする
                hasError = true;
            } else {
                input.classList.remove("input-error");
            }
        }
    }
    //入力エラーがあった場合
    if (hasError) {
        alert("赤枠の項目を入力してください！");
        return;
    }

    // 保存ボタンの中の処理
    const fullQuizData = {
        title: quizNameInput.value, // ここがクイズの名前
        questions: [] // ここに各問題（問題文、選択肢、正解）を push していく
    };

    // ループの中で各問題を fullQuizData.questions に入れる
    forms.forEach((form) => {
        fullQuizData.questions.push({
            question: form.querySelector("#quiz-question").value,
            options: Array.from(form.querySelectorAll(".option-text")).map(input => input.value),
            answer: form.querySelector('input[type="radio"]:checked').value
        });
        form.querySelector("#quiz-question").value = "";
        form.querySelectorAll(".option-text").value = "";
        form.querySelector('input[type="radio"]').value = true;

        console.log(form.querySelectorAll(".option-text").value,form.querySelector('input[type="radio"]').value )
    });

    //クイズの保存
    if(!hasError){
        const allQuizzes = JSON.parse(localStorage.getItem("myQuizzes") || "[]");
        allQuizzes.push(fullQuizData);
        localStorage.setItem("myQuizzes", JSON.stringify(allQuizzes));

        alert("全てのクイズを保存しました。");
        console.log("保存したデータ", fullQuizData);


    }
});
// #endregion
//-------------------------------------------------
// #region クイズを読み取る

// JSONファイルからデータを取り出す
const savedData = localStorage.getItem("myQuizzes");
const quizList = savedData ? JSON.parse(savedData) : [];

// クイズリストをホームで表示
function renderQuizList(){
    const listContainer = document.getElementById("home");
    const selectionContainer = document.getElementById("quiz-selection");

    let listDiv = document.getElementById("quiz-list-container");
    if(!listDiv){
        listDiv = document.createElement("div");
        listDiv.id = "quiz-list-container";
        listContainer.appendChild(listDiv);
    }
    listDiv.innerHTML = "";

    const allQuizzes = JSON.parse(localStorage.getItem("myQuizzes") || "[]");

    allQuizzes.forEach((quiz, index) => {
        // クイズボタンと削除ボタンのdivを作成
        const divBtn = document.createElement("div");
        divBtn.classList.add("quiz-item-wrapper");

        // クイズボタンを作成
        const btn = document.createElement("button");
        btn.classList.add("quiz-load-btn");
        btn.textContent = `クイズ ${index + 1}: ${quiz.title || "無題"}`;
        btn.addEventListener("click", () => {
            startQuiz(quiz);
        });
        divBtn.appendChild(btn);

        // 削除ボタンを作成
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.textContent = "削除";
        deleteBtn.addEventListener("click", () => {
            deleteQuiz(index);
        });
        divBtn.appendChild(deleteBtn);

        listDiv.appendChild(divBtn);
    })
    selectionContainer.appendChild(listDiv);
}
renderQuizList();

//-------------------------------------------------
// #region クイズを開く

// 問題をひらく
function startQuiz(quiz){
    // 1.データをセット
    currentQuizData = quiz;
    currentIndex = 0;         //何問目
    score = 0;                //得点

    // 2.画面切り替え
    navigate("quiz");

    // 3.displayQuestion
    displayQuestion();
}

// 問題と選択肢を表示
function displayQuestion(){
    const qData = currentQuizData.questions[currentIndex];

    document.getElementById("quiz-title").textContent = currentQuizData.title;
    document.getElementById("question-number").textContent = `第${currentIndex + 1}問`;
    document.getElementById("question-text").textContent = qData.question;

    const optionContainer = document.getElementById("quiz-option");
    optionContainer.innerHTML = "";

    qData.options.forEach((opText, index) => {
        const btn = document.createElement("button");
        btn.classList.add("option-btn");
        btn.textContent = opText;

        //ボタンの正誤判定
        btn.onclick = () => checkAnswer(index);

        optionContainer.appendChild(btn);
    });
}

// ボタンの正誤判定
function checkAnswer(index){
    // 1.現在の問題を取得
    const qData = currentQuizData.questions[currentIndex];

    // 2.正誤判定
    if(qData.answer == index){
        score++;
        alert("正解！")
    }else{
        alert("残念、不正解...")
    }

    // 3.次の問題に進む
    currentIndex++;

    // 4.次の問題があるかどうか
    if(currentIndex < currentQuizData.questions.length){
        //問題を表示
        displayQuestion();
    } else {
        //結果を表示
        showResult();
    }
}

// 結果を表示
function showResult(){
    // 1.リザルト画面に移動
    navigate("result");

    // 2.スコアを表示
    const resultScore = document.getElementById("result-score");
    resultScore.textContent = `${score} / ${currentQuizData.questions.length}`;
}

// #endregion
//-------------------------------------------------
// #region ログイン

// ログインボタンを押すとログインフォームが開く
const logInForm = document.querySelector('.log-in-form');
const logInBtn = document.querySelector('.log-in-btn')
logInBtn.addEventListener("click", () => {
    deleteLogInForm();
});

// ログインフォーム以外を押すとログインフォームが閉じる
document.addEventListener("click", (e) => {
    if(logInForm.classList.contains("is-show") && !e.target.closest('.log-in-form') && e.target.className != 'log-in-btn'){
        deleteLogInForm();
    }
});

// ログインフォームを消す
function deleteLogInForm(){
    // ログインフォームを表示
    logInForm.classList.toggle("is-show");
    // ボタンを閉じるに変更
    logInBtn.textContent = (logInForm.classList.contains("is-show") ? "×閉じる":"ログイン");
}

// ---ログインシステム---
const logInId = "id"; //ログインId
const password = "logInPass"; //ログインpass
const body = document.getElementById("body");

// idとパスワードを検証
function LoginVerification(){
    const logInInputValue = document.querySelector('.log-in-id').value;
    const logInPassValue = document.querySelector('.log-in-ps').value;

    if(logInId == logInInputValue && password == logInPassValue){
        alert("ログインに成功しました。");
        body.classList.add("admin");
    } else {
        alert("ID 又は password が違います。")
    }
}

// ログインの実行
document.querySelector('.log-in-inputs').addEventListener("submit", (e) => {
    e.preventDefault();

    deleteLogInForm(); // ログインフォームを消す
    LoginVerification(); // idとパスワードを検証
});

// 管理者(adminクラス)の削除ボタン
function deleteQuiz(index) {
    // 1. ローカルストレージから全データを取得（なければ空配列）
    let allQuizzes = JSON.parse(localStorage.getItem("myQuizzes") || "[]");

    // 2. 削除したいクイズ「番号以外」の要素だけで新しい配列を作る
    allQuizzes.splice(index, 1)

    // 3. フィルタリング後の配列を再びJSONにして保存
    localStorage.setItem("myQuizzes", JSON.stringify(allQuizzes));

    // 4. 画面を更新する（最新のリストを再描画）
    renderQuizList();
}