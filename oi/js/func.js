function getPar(a){var d,e,b=document.location.href,c=b.indexOf(a+"=");return-1==c?!1:(d=b.slice(a.length+c+1),e=d.indexOf("&"),-1!=e&&(d=d.slice(0,e)),d)}