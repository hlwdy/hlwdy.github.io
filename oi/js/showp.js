$(document).ready(function(){
	if(document.location.href.indexOf('?title=')!=-1){
		var url='https://colorfwdapi.pythonanywhere.com/oidata?type=getp&title='+getPar('title');
		$.get(url,function(data,textStatus){
			var res=JSON.parse(data);
			document.title=unescape(res['title']);
			ShowMd(unescape(res['text']).replaceAll(' ','&nbsp;').replaceAll('#&nbsp;','# ').replace('\n','## ').replace('\n','\n### ').replaceAll('\n','\n\n').replace('输入输出格式','### 输入输出格式').replace('输入输出样例','### 输入输出样例').replace('说明\n','### 说明\n'));
		});
	}
	$("img").on('error',function(){
		var imgs=document.getElementsByTagName('img');for(var i=0;i<imgs.length;i++)imgs[i].referrerPolicy="no-referrer";
    });
});

function ShowMd(text) {
	marked_render = new marked.Renderer()
	marked_render.old_paragraph = marked_render.paragraph
	marked_render.paragraph = function(text) {
    var isTeXInline= /\$(.*)\$/g.test(text)
    var isTeXLine= /^\$\$(\s*.*\s*)\$\$$/.test(text)
    if (!isTeXLine && isTeXInline) {
        text = text.replace(/(\$([^\$]*)\$)+/g, function($1, $2) {
            if ($2.indexOf('<code>') >= 0 || $2.indexOf('</code>') >= 0) {
                return $2
            } else {
                return "<span class=\"marked_inline_tex\">" + $2.replace(/\$/g, "") + "</span>"
            }
        })
    } 
    else {
        text = (isTeXLine) ? "<div class=\"marked_tex\">" + text.replace(/\$/g, "") +"</div>": text
    }
    text = this.old_paragraph(text)
    return text
	}
	marked.setOptions({
		renderer: marked_render,
		highlight: function(code) {
			return hljs.highlightAuto(code).value;
		}
	})
	markdown_text = marked(text)
	$('#content').html(markdown_text)
	$('#content').find('.marked_inline_tex').each(function(){
		var tex = $(this)
		katex.render(
			tex.text().replace(/[^\\](%)/g, (match)=>{return match[0] + '\\' + '%'}),
			tex[0],{
				strict: false
			}
		)
	})
	$('#content').find('.marked_tex').each(function(){
		var tex = $(this)
		katex.render(
			tex.text().replace(/[^\\](%)/g, (match)=>{return match[0] + '\\' + '%'}),
			tex[0],{
				strict: false
			}
		)
	})
}