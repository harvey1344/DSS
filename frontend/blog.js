let csrfToken = null;

function getCsrfToken() {
  return fetch('/blog/csrf-token', {
    credentials: 'include' // Include cookies in the request
  })
    .then(response => response.json())
    .then(data => {
      csrfToken = data.csrfToken;
    });
}

getCsrfToken();

function updatePost(user_id, post_id) {
  fetch('/blog/updateRequest', {
    method: 'POST',
    body: JSON.stringify({
      user_id,
      post_id,
    }),
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
      'X-CSRF-Token': csrfToken,
    },
  })
    .then(res => {
      if (res.ok) {
        if (res.redirected) {
          console.log('Redirecting to post update');
          let url = new URL(res.url);
          url.searchParams.set('post_id', post_id);
          window.location.href = url;
        }
        // Registration successful
      } else {
        // Registration failed
        alert('Unable to update');
      }
    });
}

function deletePost(user_id, post_id) {
  fetch('/blog/deleteRequest', {
    method: 'POST',
    body: JSON.stringify({
      user_id,
      post_id,
    }),
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
      'X-CSRF-Token': csrfToken,
    },
  })
    .then(res => {
      if (res.ok) {
        alert('Post deleted');
        getPosts();
      } else {
        alert('An error occurred. Please try again.');
      }
    });
}

async function getPosts() {
  return await fetch('/blog/posts')
    .then(res => {
      return res.json();
    })
    .then(data => {
      const posts = document.querySelectorAll('.post');
      posts.forEach(post => {
        post.remove();
      });

      let postData = data.posts;
      let user_id = data.id;

      const postsContainer = document.getElementById('posts-container');

      for (let x = 0; x < postData.length; x++) {
        const post = document.createElement('div');
        post.id = postData[x].post_id;
        post.className = 'post';

        const postTitle = document.createElement('h2');
        postTitle.appendChild(document.createTextNode(postData[x].title));
        post.appendChild(postTitle);

        const userName = document.createElement('h3');
        userName.appendChild(document.createTextNode(postData[x].user_name));
        post.appendChild(userName);

        const body = document.createElement('p');
        body.appendChild(document.createTextNode(postData[x].body));
        post.appendChild(body);

        if (postData[x].user_id == user_id) {
          const updateButton = document.createElement('button');
          updateButton.innerHTML = 'Edit Post';
          updateButton.addEventListener('click', function () {
            updatePost(postData[x].user_id, postData[x].post_id);
          });
          post.appendChild(updateButton);

          const deleteButton = document.createElement('button');
          deleteButton.innerHTML = 'Delete Post';
          deleteButton.addEventListener('click', function () {
            deletePost(postData[x].user_id, postData[x].post_id);
          });
          post.appendChild(deleteButton);
        }

        postsContainer.appendChild(post);
      }
      return postData;
    });
}

let posts = getPosts();

console.log(posts);

async function searchPosts() {
  searchText = sanitizeInput(document.getElementById('searchBar').value);
  return fetch('/blog/search', {
        method: 'POST',
        body: JSON.stringify({ searchText }),
        headers: {
        'Content-type': 'application/json; charset=UTF-8',
        'X-CSRF-Token': csrfToken,
        },
    })
    .then(res => {
        return res.json();
    })
    .then(data => {
        const posts = document.querySelectorAll('.post');
        posts.forEach(post => {
            post.remove();
        });
        let postData = data.posts;
        let user_id = data.id;
    
        let cancelSearch = document.getElementById('cancel-search');
        if (!cancelSearch) {
            const cancelSearchContainer = document.getElementById('cancel-container');
            cancelSearch = document.createElement('button');
            cancelSearch.innerHTML = 'Cancel Search';
            cancelSearch.id = 'cancel-search';
            cancelSearch.addEventListener('click', function () {
            cancelSearch.remove();
            getPosts();
            });
        cancelSearchContainer.appendChild(cancelSearch);
        }
    
      const postsContainer = document.getElementById('posts-container');
    
      for (let x = 0; x < postData.length; x++) {
        const post = document.createElement('div');
        post.id = postData[x].post_id;
        post.className = 'post';
    
        const postTitle = document.createElement('h2');
        postTitle.appendChild(document.createTextNode(postData[x].title));
        post.appendChild(postTitle);
    
        const userName = document.createElement('h3');
        userName.appendChild(document.createTextNode(postData[x].user_name));
        post.appendChild(userName);
    
        const body = document.createElement('p');
        body.appendChild(document.createTextNode(postData[x].body));
        post.appendChild(body);
    
        if (postData[x].user_id == user_id) {
          const updateButton = document.createElement('button');
          updateButton.innerHTML = 'Edit Post';
          updateButton.addEventListener('click', function () {
            updatePost(postData[x].user_id, postData[x].post_id);
          });
          post.appendChild(updateButton);
        }
    
        postsContainer.appendChild(post);
      }
      return postData;
    });
}
const logout = () => {
    fetch('/logout', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
            'X-CSRF-Token': csrfToken,
            },
        })
        .then(res => {
            if (res.ok) {
                alert('Logout successful');
                window.location.href = '/';
            } else {
                alert('Logout failed. Please try again');
            }
        })
        .catch(error => {
        console.error('Error:', error);
    });
};