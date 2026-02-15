// PDF合并工具 - 主要逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 最多支持的文件数量
    const MAX_FILES = 10;
    
    // 生成初始的10个文件输入组
    const container = document.getElementById('fileInputsContainer');
    for (let i = 1; i <= MAX_FILES; i++) {
        container.appendChild(createFileInputGroup(i));
    }
    
    // 添加/删除按钮事件
    document.getElementById('addFileBtn').addEventListener('click', addFile);
    document.getElementById('removeFileBtn').addEventListener('click', removeFile);
    
    // 合并按钮事件
    document.getElementById('mergeBtn').addEventListener('click', mergePDFs);
    
    // 初始化页面范围值 - 将所有起始页设为1，结束页设为最大值
    initializePageRanges();
});

// 创建文件输入组
function createFileInputGroup(index) {
    const group = document.createElement('div');
    group.className = 'file-input-group';
    group.innerHTML = `
        <label for="file${index}">文件 ${index}:</label>
        <div class="file-input-wrapper">
            <button type="button" class="file-input-button">选择PDF文件</button>
            <span class="selected-file" id="selectedFile${index}">未选择文件</span>
            <input type="file" id="file${index}" accept=".pdf" />
        </div>
        <div class="page-range">
            <label>从第:</label>
            <input type="number" id="start${index}" min="1" value="1" />
            <label>到第:</label>
            <input type="number" id="end${index}" min="1" value="" placeholder="最后一页" />
        </div>
    `;
    
    // 为新创建的文件选择按钮添加事件监听器
    const fileButton = group.querySelector('.file-input-button');
    const fileInput = group.querySelector(`#file${index}`);
    const selectedFileSpan = group.querySelector(`#selectedFile${index}`);
    
    fileButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            selectedFileSpan.textContent = this.files[0].name;
            // 当选择了文件后，自动设置最大页数
            setMaxPageNumber(this.files[0], index);
        } else {
            selectedFileSpan.textContent = '未选择文件';
        }
    });
    
    return group;
}

// 设置最大页数
function setMaxPageNumber(file, index) {
    // 使用pdf-lib加载PDF以获取页数
    const reader = new FileReader();
    reader.onload = async function() {
        const arrayBuffer = reader.result;
        try {
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();
            const endInput = document.getElementById(`end${index}`);
            endInput.max = totalPages;
            if (!endInput.value) {
                endInput.value = totalPages;
            }
        } catch (error) {
            console.error(`无法读取PDF ${file.name} 的页数:`, error);
        }
    };
    reader.readAsArrayBuffer(file);
}

// 初始化页面范围值
function initializePageRanges() {
    for (let i = 1; i <= MAX_FILES; i++) {
        const startInput = document.getElementById(`start${i}`);
        const endInput = document.getElementById(`end${i}`);
        
        startInput.addEventListener('change', function() {
            const start = parseInt(this.value) || 1;
            const endInputField = document.getElementById(`end${i}`);
            if (parseInt(endInputField.value) < start) {
                endInputField.value = start;
            }
        });
        
        endInput.addEventListener('change', function() {
            const end = parseInt(this.value);
            const startInput = document.getElementById(`start${i}`);
            const start = parseInt(startInput.value) || 1;
            
            if (end && end < start) {
                this.value = start;
            }
        });
    }
}

// 添加更多文件输入区域
function addFile() {
    const groups = document.querySelectorAll('.file-input-group');
    if (groups.length < MAX_FILES) {
        const newGroupIndex = groups.length + 1;
        if (newGroupIndex <= MAX_FILES) {
            document.getElementById('fileInputsContainer').appendChild(createFileInputGroup(newGroupIndex));
        }
    }
}

// 删除最后一个文件输入区域
function removeFile() {
    const groups = document.querySelectorAll('.file-input-group');
    if (groups.length > 1) {
        groups[groups.length - 1].remove();
    }
}

// 合并PDF函数
async function mergePDFs() {
    const outputFilename = document.getElementById('outputFilename').value || 'merged.pdf';
    
    // 显示进度条
    showProgress(true);
    
    try {
        // 创建新的PDF文档
        const mergedPdf = await PDFLib.PDFDocument.create();
        
        // 获取所有文件输入组
        const fileGroups = document.querySelectorAll('.file-input-group');
        
        for (let i = 0; i < fileGroups.length; i++) {
            const fileInput = fileGroups[i].querySelector('input[type="file"]');
            const startInput = fileGroups[i].querySelector('input[id^="start"]');
            const endInput = fileGroups[i].querySelector('input[id^="end"]');
            
            if (fileInput.files.length === 0) continue;
            
            const file = fileInput.files[0];
            if (!file.name.toLowerCase().endsWith('.pdf')) {
                throw new Error(`文件 "${file.name}" 不是一个有效的PDF文件`);
            }
            
            // 更新进度
            updateProgress(`正在处理 ${file.name}...`, ((i + 1) / fileGroups.length) * 50);
            
            // 读取PDF文件
            const arrayBuffer = await readFileAsArrayBuffer(file);
            const sourcePdf = await PDFLib.PDFDocument.load(arrayBuffer);
            
            // 确定复制的页面范围
            const startPage = Math.max(1, parseInt(startInput.value) || 1) - 1; // 转换为0索引
            let endPage = (parseInt(endInput.value) || sourcePdf.getPageCount()) - 1; // 转换为0索引
            
            // 确保结束页不超出文档范围
            endPage = Math.min(endPage, sourcePdf.getPageCount() - 1);
            
            if (startPage > endPage) {
                throw new Error(`在 "${file.name}" 中，开始页不能大于结束页`);
            }
            
            // 复制指定范围的页面
            const pagesToCopy = [];
            for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
                pagesToCopy.push(pageNum);
            }
            
            const copiedPages = await mergedPdf.copyPages(sourcePdf, pagesToCopy);
            
            // 将复制的页面添加到合并文档中
            copiedPages.forEach(page => mergedPdf.addPage(page));
            
            // 更新进度
            updateProgress(`已添加 ${file.name}`, ((i + 1) / fileGroups.length) * 100);
        }
        
        // 生成合并后的PDF字节数组
        updateProgress('正在生成合并后的PDF...', 100);
        const mergedPdfBytes = await mergedPdf.save();
        
        // 创建下载链接
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const downloadLink = document.getElementById('downloadLink');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = outputFilename;
        downloadLink.classList.remove('hidden');
        
        // 显示成功消息
        document.getElementById('resultMessage').textContent = 'PDF合并成功！';
        document.getElementById('resultSection').classList.remove('hidden');
        
    } catch (error) {
        console.error('PDF合并过程中出现错误:', error);
        document.getElementById('resultMessage').textContent = `错误: ${error.message}`;
        document.getElementById('resultSection').classList.remove('hidden');
    } finally {
        showProgress(false);
    }
}

// 读取文件为ArrayBuffer的帮助函数
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = () => {
            resolve(reader.result);
        };
        
        reader.onerror = () => {
            reject(new Error('无法读取文件'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

// 显示/隐藏进度条
function showProgress(show) {
    const progressContainer = document.getElementById('progressContainer');
    if (show) {
        progressContainer.classList.remove('hidden');
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('progressText').textContent = '准备开始...';
    } else {
        progressContainer.classList.add('hidden');
    }
}

// 更新进度显示
function updateProgress(text, percent) {
    document.getElementById('progressText').textContent = text;
    document.getElementById('progressBar').style.width = `${percent}%`;
}