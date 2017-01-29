module.exports = `<script>
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('toggle')) {
            const el = document.getElementById(e.target.getAttribute('data-el'));
            if (el) {
                el.classList.toggle('hidden');
                const hidden = el.classList.contains('hidden');
                e.target.innerHTML = hidden? '...': 'x';
                if (!hidden) {
                    e.target.classList.add('hide');
                } else  {
                    e.target.classList.remove('hide');
                }

            }
        }
    });
    // document.addEventListener('DOMContentLoaded', () => {
    //
    // });
    </script>`;
