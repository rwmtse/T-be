(function () {
	/** global flag to enable/disable debugging **/
	DEBUG = true;
	
	this.apptime = {
		"Tube" : function(authKey) {
			/*
			 * Private members
			 */
			var authKey_ = authKey ? authKey : '';
			// TODO developer should use their own key
			var developerKey_ = 'AI39si69Wbij78SJ860QpZvcHTbHrnwedus7dSqKRsNysIRpd_Ax3w2CoptBCAstJsruuUyxZ2PGMrMJx7_Zj2dSY-ahKkxdvQ';
			
			var getAuthRequestHeaders = function() {
				return {
					'Authorization' : 'GoogleLogin auth=' + authKey_,
					'X-GData-Key' : 'key=' + developerKey_
				};
			};
			
			var getVideoListItem = function(video) {		
				var thumb = document.createElement('img');
				$(thumb).attr('src', video.thumbnail.sqDefault);
				$(thumb).addClass('ui-li-thumb');
								
				var videoDirectLink = document.createElement('a');					
				$(videoDirectLink).attr('href', video.content["1"]);
				$(videoDirectLink).append(document.createTextNode(video.title));
				
				var detailLink = document.createElement('a');
				$(detailLink).attr('data-theme', 'c');
				$(detailLink).attr('href', 'video_detail.html?vid=' + video.id);
				$(detailLink).attr('rel', 'external');
				$(detailLink).append(document.createTextNode('Details'));
				
				var desc = document.createElement('p');
				$(desc).append(document.createTextNode(video.description));					
				
				var title = document.createElement('h3');
				$(title).append(videoDirectLink);	
				
				var uploader = document.createElement('span');
				$(uploader).append(document.createTextNode('by '));
				$(uploader).append(document.createTextNode(video.uploader));
				
				var separator = document.createElement('span');
				$(separator).append(document.createTextNode(' | '));
				
				var dateAdded = document.createElement('span');
				$(dateAdded).append(document.createTextNode(humaneDate(video.uploaded.replace(/\.\d{3}/g,''))));
				
				var viewCount = document.createElement('span');
				$(viewCount).append(document.createTextNode(addCommas(video.viewCount) + ' views'));
				
				var metadata = document.createElement('p');
				$(metadata).append(uploader).append(separator).append(dateAdded).append($(separator).clone()).append(viewCount);
				
				var li = document.createElement('li');
				$(li).append(thumb).append(title).append(desc).append(metadata).append(detailLink);
				$(li).addClass('ui-li-has-thumb');
						
				return li;
			};
			
			var mapEntryToVideo = function(entry) {
				var fullIdPath = entry.id.$t.split('/');
				var title = entry.title.$t;
				var author = entry.author[0].name.$t; // TODO
				var rating = entry.gd$rating ? entry.gd$rating.average : 0;
				var contentLink = entry.media$group.media$content ? $.grep(entry.media$group.media$content, function(el){
					return (el.yt$format && el.yt$format == 1);
				}) : [];
				var thumbnail = entry.media$group.media$thumbnail[0].url; // TODO
				
				// empty array means video not available for mobile
				if (contentLink.length > 0) {
					var video = {
						'thumbnail' : { 'sqDefault' : thumbnail },
						'content' : { '1' : contentLink[0].url },
						'id' : fullIdPath[fullIdPath.length - 1],
						'title' : title,
						'description' : entry.media$group.media$description.$t,
						'uploader' : author,
						'uploaded' : entry.published.$t,
						'viewCount' : entry.yt$statistics ? entry.yt$statistics.viewCount : 0
					};
					
					return video;
				}
				
				return null;
			};
			
			/*
			 * Public members
			 */
			this.search = function(searchTerm) {
				$.ajax({
					type : 'GET',
					url : apptime.Tube.URL.search + searchTerm,
					dataType : 'json',
					headers : getAuthRequestHeaders(),
					success : function(data, textStatus, jqXHR) {
					
					},
					error : function(xhr, type) {
						
					}
				});
			};
			
			this.getFavoritesFeed = function() {				
				$.ajax( {
					type : 'GET',
					url : apptime.Tube.URL.favorites,
					dataType : 'json',
					headers : getAuthRequestHeaders(),
					success : function(data, textStatus, jqXHR) {
						alert(data);
						var data = data.data;
						var total = data.totalItems;
						
						var maxItemsPerPage = data.itemsPerPage;
						for ( var i = 0; i < data.items.length; i++) {
							var item = data.items[i];
							var video = item.video;
										
							if (video.content["1"]) {
								// TODO bug, keep appending... repeating entries
								$('#fav').append(getVideoListItem(video));
							} else {
								// not available for mobile?
							}												
						}
						
						$('#fav').listview('refresh');
					},
					error : function(xhr, type) {
						alert(type);
						alert(xhr.responseText);
					}
				});
			};
			
			this.getRelatedVideosFeed = function(vid) {				
				$.ajax( {
					type : 'GET',
					url : apptime.Tube.URL.relatedVideos.replace('_vid_', vid),
					dataType : 'json',
					success : function(data, textStatus, jqXHR) {
						alert(data);
						var data = data.data;
						var total = data.totalItems;
						alert('total=' + total);			
						var maxItemsPerPage = data.itemsPerPage;
						
						$('ul li span').append(document.createTextNode(data.totalItems));
						
						// TODO: load more
						
						for ( var i = 0; i < data.items.length; i++) {
							var video = data.items[i];
										
							if (video.content && video.content["1"]) {
								$('#relatedvideos').append(getVideoListItem(video));
							} else {
								// not available for mobile?
							}												
						}
						
						$('#relatedvideos').listview('refresh');
					},
					error : function(xhr, type) {
						alert(type);
						alert(xhr.responseText);
					}
				});
			};
			
			this.getVideoDetail = function() {
				var vid = getParameterByName('vid');
				
				$.ajax( {
					type : 'GET',
					url : apptime.Tube.URL.videoDetail.replace('_vid_', vid),
					dataType : 'json',
					success : function(data, textStatus, jqXHR) {
						var video = data.data;
						$('div h1').append(document.createTextNode(video.title));
						
						var img = document.createElement('img');
						$(img).attr('src', video.thumbnail.sqDefault);
						
						var span = document.createElement('span');
						$(span).addClass('ui-li-aside');
							
						var uploaded = document.createElement('strong');
						$(uploaded).append(document.createTextNode(humaneDate(video.uploaded.replace(/\.\d{3}/g,''))));
						var br = document.createElement('br');
						
						var uploader = document.createElement('span');
						$(uploader).append(document.createTextNode(video.uploader));
						
						var star = document.createElement('img');
						$(star).attr('src', 'icons/star_full.png');
						
						var like = document.createElement('a');
						$(like).attr('href', '#');
						$(like).attr('data-icon', 'check');
						$(like).attr('data-iconpos', 'notext');
						$(like).attr('data-role', 'button');
						$(like).append(document.createTextNode('Like'));
				
						var dislike = document.createElement('a');
						$(dislike).attr('href', '#');
						$(dislike).attr('data-icon', 'delete');
						$(dislike).attr('data-iconpos', 'notext');
						$(dislike).attr('data-role', 'button');
						$(dislike).append(document.createTextNode('Dislike'));
							
						$(span).append(uploaded).append(br).append(uploader).append($(br).clone()).append(like).append(dislike);
						
						var desc = document.createElement('p');
						$(desc).append(document.createTextNode(video.description));
						
						var fieldset = document.createElement('fieldset');
						$(fieldset).addClass('ui-grid-a');
						
						var playDiv = document.createElement('div');
						$(playDiv).addClass('ui-block-a');
						var playButton = document.createElement('a'); //document.createElement('button');
						//$(playButton).attr('type', 'submit');
						$(playButton).attr('href',video.content['1']);
						$(playButton).attr('data-role', 'button');
						$(playButton).append(document.createTextNode('Play'));
						$(playDiv).append(playButton);
						
						var shareDiv = document.createElement('div');
						$(shareDiv).addClass('ui-block-b');
						var shareButton = document.createElement('button');
						$(shareButton).attr('type', 'submit');
						$(shareButton).append(document.createTextNode('Share'));
						$(shareDiv).append(shareButton);
						
						$(fieldset).append(playDiv).append(shareDiv);
						
						$('#details').append(img).append(span).append(desc).append(fieldset);						
						
						// make sure dynamic elements get proper styles
						$('#videodetails').page('destroy').page();
						
						getRelatedVideosFeed(vid);
					},
					error : function(xhr, type) {
						alert(type);
						alert(xhr.responseText);
					}
				});			
			};
			
			this.login = function(username, password, redirect) {
				if (!username || !password) {
					return;
				}
				
				alert('login=' + username + ',' + password);

				$.ajax( {
					url : apptime.Tube.URL.login,
					global : false,
					type : 'POST',
					data : 'Email=' + username + '&Passwd=' + password
							+ '&service=youtube&source=TestLogin',
					dataType : 'text',
					success : function(data, textStatus, jqXHR) {
						alert(jqXHR.responseText);
						var AUTH = 'Auth=';
						var index = jqXHR.responseText.indexOf(AUTH);
						authKey_ = jqXHR.responseText.substring(index + AUTH.length, jqXHR.responseText.length - 1);			
						createCookie('Tube.authKey', authKey_, 7); // TODO: store key for 7 days
						alert('authKey=' + authKey_);
						
						if (!redirect) {
							redirect = '#main';
						}
						
						alert('redirect=' + redirect);
						
						// redirect to destination page
						$.mobile.changePage(redirect);
					},
					error : function(jqXHR, textStatus, errorThrown) {
						alert("login failed, error=" + errorThrown);
					}
				});
			};
			
			this.getNewSubscriptionVideos = function(channel) {
				// filter results by channel
				// TODO: UI to choose between all new videos or by channel
				var populateList = function(data) {
					var feed = data.feed;
					var total = feed.openSearch$totalResults.$t;
					
					for (var i = 0; i < feed.entry.length; i++) {
						var entry = feed.entry[i];
						var video = mapEntryToVideo(entry);
						// null means video not available for mobile
						if (video != null) {							
							$('#newvideos').append(getVideoListItem(video));
						}
					}
					
					$('#newvideos').listview('refresh');
				};
				
				if (DEBUG) {
					populateList(newSubsData);
				} else {
					$.ajax({
						type : 'GET',
						url : apptime.Tube.URL.newSubscriptions,
						dataType : 'json',
						headers : getAuthRequestHeaders(),
						success : function(data, textStatus, jqXHR) {							
							populateList(data);														
						},
						error : function(xhr, type) {
							alert(type);
							alert(xhr.responseText);
						}
					});
				}				
			};
			
			this.getSubscribedChannels = function() {
				var populateList = function(data) {
					var feed = data.feed;
					var total = feed.openSearch$totalResults.$t;
					
					for (var i = 0; i < feed.entry.length; i++) {
						var entry = feed.entry[i];
						var username = entry.yt$username.$t;
						var item = document.createElement('li');
						$(item).append(document.createTextNode(username));
						
						var link = document.createElement('a');
						$(link).attr('href', 'subscriptions_channel.html?author=' + username);
						
						$('#channels').append(item);
					}
					
					$('#channels').listview('refresh');					
				};
				
				if (DEBUG) {
					populateList(subChannelData);
				} else {
					$.ajax({
						type : 'GET',
						url : apptime.Tube.URL.subscriptions,
						dataType : 'json',
						headers : getAuthRequestHeaders(),
						success : function(data, textStatus, jqXHR) {		
							populateList(data);							     
						},
						error : function(xhr, type) {
							alert(type);
							alert(xhr.responseText);
						}
					});
				}
			};
			
			this.getSubscriptions = function() {
				this.getNewSubscriptionVideos();
				this.getSubscribedChannels();
			};
		}
	};	
				
	this.apptime.Tube.getInstance = function() {
		var tube = null;				
		var authKey = readCookie('Tube.authKey');
		
		if (authKey) {
			tube = new apptime.Tube(authKey);
		} else {
			tube = new apptime.Tube();
		}
			
		return tube;
	};
	
	this.apptime.Tube.URL = {};
	this.apptime.Tube.URL.__defineGetter__('login', function() { return 'https://www.google.com/accounts/ClientLogin'; });
	this.apptime.Tube.URL.__defineGetter__('favorites', function() { return 'http://gdata.youtube.com/feeds/api/users/default/favorites?v=2&alt=jsonc'; });
	this.apptime.Tube.URL.__defineGetter__('subscriptions', function() { return 'http://gdata.youtube.com/feeds/api/users/default/subscriptions?v=2&alt=json'; });
	this.apptime.Tube.URL.__defineGetter__('newSubscriptions', function() { return 'http://gdata.youtube.com/feeds/api/users/default/newsubscriptionvideos?alt=json'; });
	this.apptime.Tube.URL.__defineGetter__('playlists', function() { return 'http://gdata.youtube.com/feeds/api/users/default/playlists?v=2&alt=jsonc'; });
	/*
	 * search term to be filled in
	 */
	this.apptime.Tube.URL.__defineGetter__('search', function() { return 'http://gdata.youtube.com/feeds/api/videos?v=2&alt=jsonc&q='; });
	/*
	 * _vid_ should be actual video id
	 */	
	this.apptime.Tube.URL.__defineGetter__('videoDetail', function() { return 'http://gdata.youtube.com/feeds/api/videos/_vid_?v=2&alt=jsonc'; });
	/*
	 * _vid_ should be actual video id
	 */	
	this.apptime.Tube.URL.__defineGetter__('relatedVideos', function() { return 'http://gdata.youtube.com/feeds/api/videos/_vid_/related?v=2&alt=jsonc'; });
	
	this.apptime.Tube.URL_SHARE = {};
	this.apptime.Tube.URL_SHARE.__defineGetter__('facebook', function() { return 'http://m.facebook.com/sharer.php'; });
})();