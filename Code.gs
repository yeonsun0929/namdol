/**
 * [Code.gs]
 * 잘생긴 남돌 모음집 백엔드 서버 스크립트
 * 대상 스프레드시트 ID: 1zVuZKZCx4Zx5W6-aPId2zGKIOYCRe1z8xF9U5AeCQ_c
 */

const SPREADSHEET_ID = '1zVuZKZCx4Zx5W6-aPId2zGKIOYCRe1z8xF9U5AeCQ_c';
const SHEET_NAME = '남돌모음집'; // 시트 탭 이름 (없으면 자동 생성됨)

/**
 * 웹 앱 초기 접속 시 HTML 페이지를 렌더링합니다.
 */
function doGet(e) {
  try {
    // 초기 실행 시 시트 및 헤더 세팅 확인
    initSheetIfNeeded();
    
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('✨ 잘생긴 남돌 모음집 Archive')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (error) {
    return HtmlService.createHtmlOutput('<h3>오류가 발생했습니다: ' + error.message + '</h3>');
  }
}

/**
 * 시트가 존재하는지 확인하고, 없으면 새로 생성한 뒤 헤더(첫 줄)를 추가합니다.
 */
function initSheetIfNeeded() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // 헤더 설정
    const headers = ['등록일시', '아이돌 이름', '소속 그룹', '이미지 URL', '입덕 포인트 / 코멘트', '추천수'];
    sheet.appendRow(headers);
    
    // 헤더 스타일링 (가독성 향상)
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#4F46E5')
               .setFontColor('#FFFFFF')
               .setFontWeight('bold')
               .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * 스프레드시트에서 모든 남돌 데이터를 불러옵니다.
 * @return {Array<Object>} 아이돌 데이터 배열
 */
function getIdolList() {
  try {
    const sheet = initSheetIfNeeded();
    const lastRow = sheet.getLastRow();
    
    // 데이터가 헤더만 있는 경우 빈 배열 반환
    if (lastRow <= 1) {
      return [];
    }
    
    // 2번째 행부터 마지막 행까지 데이터 가져오기 (1열 ~ 6열)
    const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    
    // 최신 등록순으로 정렬하기 위해 reverse() 처리 및 객체 매핑
    const idolList = data.map((row, index) => {
      return {
        rowIndex: index + 2, // 실제 시트의 행 번호 (좋아요 업데이트용)
        createdAt: row[0] ? Utilities.formatDate(new Date(row[0]), 'Asia/Seoul', 'yyyy.MM.dd HH:mm') : '',
        name: String(row[1]),
        group: String(row[2]),
        imageUrl: String(row[3]),
        comment: String(row[4]),
        likes: Number(row[5]) || 0
      };
    }).reverse();
    
    return idolList;
  } catch (error) {
    throw new Error('데이터를 불러오는 중 오류가 발생했습니다: ' + error.message);
  }
}

/**
 * 새로운 잘생긴 남돌 정보를 스프레드시트에 추가합니다.
 * @param {Object} formData - { name, group, imageUrl, comment }
 * @return {Object} 처리 결과 및 최신 목록
 */
function addIdol(formData) {
  try {
    if (!formData.name || !formData.group) {
      throw new Error('아이돌 이름과 그룹명은 필수 입력 항목입니다.');
    }
    
    const sheet = initSheetIfNeeded();
    const now = new Date();
    
    // 이미지 URL이 비어있을 경우 기본 플레이스홀더 제공
    const validImageUrl = formData.imageUrl && formData.imageUrl.trim() !== '' 
      ? formData.imageUrl.trim() 
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
      
    const newRow = [
      now,
      formData.name.trim(),
      formData.group.trim(),
      validImageUrl,
      formData.comment ? formData.comment.trim() : '비주얼이 완벽합니다 ✨',
      1 // 등록 시 기본 추천 1점
    ];
    
    sheet.appendRow(newRow);
    
    return {
      success: true,
      message: `${formData.group} ${formData.name} 님이 모음집에 등록되었습니다!`,
      list: getIdolList()
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * 특정 아이돌의 추천수(좋아요)를 1 증가시킵니다.
 * @param {number} rowIndex - 시트의 행 번호
 * @return {Object} 업데이트된 추천수
 */
function incrementLike(rowIndex) {
  try {
    const sheet = initSheetIfNeeded();
    const likeCell = sheet.getRange(rowIndex, 6);
    const currentLikes = Number(likeCell.getValue()) || 0;
    const newLikes = currentLikes + 1;
    
    likeCell.setValue(newLikes);
    
    return {
      success: true,
      likes: newLikes
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}
