$(document).ready(function(){
	var url='https://colorfwdapi.pythonanywhere.com/oidata?type=r';
	$.get(url,function(data,textStatus){
		var res=JSON.parse(data);
		//console.log(res);
		var tbody=document.getElementById('mainTable');
		for(var i=0;i<res.length;i++){
			tbody.appendChild(getNewRow(unescape(res[i]['title']),res[i]['year']))
			//console.log(unescape(res[i]['title']));
		}
	});
});

function getNewRow(title,label){
	var row=document.createElement('tr');
	var titleCell=document.createElement('td');
	titleCell.innerHTML='<a target="_blank" href="problem.html?title='+title.replace(' ','%20')+'">'+title+'</a>';
	row.appendChild(titleCell);
	var labelCell=document.createElement('td');
	labelCell.innerHTML=label;
	row.appendChild(labelCell);
	return row;
}