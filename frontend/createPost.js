const createPost=()=>{
    let title = document.getElementById('title').value;
    let body = document.getElementById('body').value;

    title = sanitizeInput(title);
    body = sanitizeInput(body)
    fetch('/csrf-token', {
        credentials: 'include' // Include cookies in the request
      })
      .then(response => response.json())
      .then(data => {
        const csrfToken = data.csrfToken;

        return fetch('/blog/createPost', {
            // Adding method type
            method: 'POST',
            // Adding body or contents to send
            body: JSON.stringify({
                title,
                body
            }),
            // Adding headers to the request
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                "X-CSRF-Token": csrfToken,
            },
        }).then(res=>{
            if (res.redirected) {
                console.log('redirecting blog');
                window.location.href = res.url
            } else {
                // Registration failed
                alert("unable to create post");            
            }
        });
    })
};